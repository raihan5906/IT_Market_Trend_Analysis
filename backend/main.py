import os
import re
import json
from typing import Literal, Optional, List
import joblib
from scipy.sparse import hstack
from dotenv import load_dotenv
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "web_app_data")

# Load .env from backend/ or project root
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))

app = FastAPI(title="Indian IT Labour Market Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open(os.path.join(DATA_DIR, "model1_skill_demand.json"), encoding="utf-8") as f:
    M1 = json.load(f)

with open(os.path.join(DATA_DIR, "model2_apriori.json"), encoding="utf-8") as f:
    M2 = json.load(f)

with open(os.path.join(DATA_DIR, "model3_metadata.json"), encoding="utf-8") as f:
    M3_META = json.load(f)

with open(os.path.join(DATA_DIR, "model4_trends.json"), encoding="utf-8") as f:
    M4 = json.load(f)

with open(os.path.join(DATA_DIR, "model5_forecast.json"), encoding="utf-8") as f:
    M5 = json.load(f)

with open(os.path.join(DATA_DIR, "addon_companies.json"), encoding="utf-8") as f:
    ADDON = json.load(f)

CLS_BUNDLE = joblib.load(os.path.join(DATA_DIR, "model3_classifiers.joblib"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
gemini_client = (
    genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(api_version="v1beta"),
    )
    if GEMINI_API_KEY
    else None
)
# Cache verified results in memory so repeated clicks on the same skill/role respond instantly
TREND_VERIFY_CACHE = {}


class ClassifyRequest(BaseModel):
    text: str
    skills: Optional[List[str]] = None
    model_name: str = "Logistic Regression"


def _extract_json_block(raw_text: str) -> dict:
    cleaned = (raw_text or "").strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            return json.loads(match.group(0))
        raise


def _build_verify_prompt(kind: str, name: str, local_series: list, use_search: bool) -> str:
    search_step = (
        f'1. Use Google Search to verify real-world hiring and demand trends for "{name}" in the Indian and global IT sector across 2020-2026.'
        if use_search
        else f'1. Audit real-world hiring and demand trends for "{name}" in the Indian and global IT sector across 2020-2026.'
    )
    return f"""
You are a mandatory labour-market data auditor for the Indian IT job market (2020-2026).
Target {kind}: "{name}"

Local model time-series output:
{json.dumps(local_series, indent=2)}

Instructions:
{search_step}
2. Check whether the local model's trajectory (especially demand_pct and count across years) is accurate or distorted by dataset sampling artifacts.
3. If the local series is inaccurate or misleading, correct the values in "series" while preserving the exact periods and realistic Indian IT job posting scales, and set "corrected": true.
4. If the local series accurately reflects real-world market trends, keep the values unchanged and set "corrected": false.

Return ONLY valid JSON matching this schema:
{{
  "verified": true,
  "corrected": false,
  "reason": "Concise 1-2 sentence explanation of the verification or correction.",
  "sources": ["https://..."],
  "series": [
    {{"period": "2020", "count": 100, "total_postings": 5000, "demand_pct": 2.0}}
  ]
}}
""".strip()


def _call_gemini_with_optional_search(prompt_with_search: str, prompt_no_search: str):
    try:
        return gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt_with_search,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                temperature=0.1,
            ),
        )
    except Exception as search_exc:
        print("GEMINI SEARCH CALL FAILED, RETRYING WITHOUT SEARCH TOOL:", repr(search_exc))
        return gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt_no_search,
            config=types.GenerateContentConfig(
                temperature=0.1,
            ),
        )


def _verify_series_with_gemini(kind: str, name: str, local_series: list) -> dict:
    if not gemini_client:
        return {
            "kind": kind,
            "name": name,
            "verified": False,
            "corrected": False,
            "reason": "GEMINI_API_KEY is not configured in .env; displaying local model output.",
            "sources": [],
            "series": local_series,
        }

    prompt_with_search = _build_verify_prompt(kind, name, local_series, use_search=True)
    prompt_no_search = _build_verify_prompt(kind, name, local_series, use_search=False)

    try:
        response = _call_gemini_with_optional_search(prompt_with_search, prompt_no_search)
        parsed = _extract_json_block(response.text or "")

        cleaned_series = []
        raw_series = parsed.get("series") if isinstance(parsed.get("series"), list) else local_series
        for idx, row in enumerate(raw_series):
            fallback = local_series[idx] if idx < len(local_series) else {}
            cnt = int(row.get("count", fallback.get("count", 0)))
            tot = max(int(row.get("total_postings", fallback.get("total_postings", 1))), 1)
            pct = row.get("demand_pct")
            if pct is None:
                pct = round((cnt / tot) * 100, 2)
            cleaned_series.append({
                "period": str(row.get("period", fallback.get("period", ""))),
                "count": cnt,
                "total_postings": tot,
                "demand_pct": round(float(pct), 2),
            })

        grounding_urls = []
        for u in (parsed.get("sources") or []):
            if isinstance(u, str) and u.startswith("http") and u not in grounding_urls:
                grounding_urls.append(u)

        try:
            chunks = response.candidates[0].grounding_metadata.grounding_chunks or []
            for ch in chunks:
                uri = getattr(getattr(ch, "web", None), "uri", None)
                if uri and uri not in grounding_urls:
                    grounding_urls.append(uri)
        except Exception:
            pass

        return {
            "kind": kind,
            "name": name,
            "verified": bool(parsed.get("verified", True)),
            "corrected": bool(parsed.get("corrected", False)),
            "reason": str(parsed.get("reason", "Verified against real-world market data.")),
            "sources": grounding_urls[:5],
            "series": cleaned_series if cleaned_series else local_series,
        }
    except Exception as exc:
        print("GEMINI VERIFY ERROR:", repr(exc))
        return {
            "kind": kind,
            "name": name,
            "verified": False,
            "corrected": False,
            "reason": f"Web verification fallback ({type(exc).__name__}: {str(exc)[:180]}); showing local model output.",
            "sources": [],
            "series": local_series,
        }


@app.get("/")
def health_check():
    return {
        "status": "running",
        "project": "Indian IT Labour Market Intelligence System",
        "gemini_verification_enabled": bool(gemini_client),
        "gemini_model": GEMINI_MODEL,
    }


@app.get("/api/skill-demand")
def get_skill_demand():
    return M1


@app.get("/api/apriori")
def get_apriori():
    return M2


@app.get("/api/classification/meta")
def get_cls_meta():
    return M3_META


@app.post("/api/classification/predict")
def predict_role(req: ClassifyRequest):
    cleaned_text = req.text.strip()
    if not cleaned_text:
        return {
            "predicted_role": "Please enter a job description or skill list",
            "top_probabilities": [],
            "blueprint": None,
        }

    vec = hstack([
        CLS_BUNDLE["vec_title"].transform([cleaned_text]) * 2.0,
        CLS_BUNDLE["vec_body"].transform([cleaned_text]),
    ])
    clf = CLS_BUNDLE["models"].get(req.model_name, CLS_BUNDLE["models"]["Logistic Regression"])
    pred = clf.predict(vec)[0]
    probs = clf.predict_proba(vec)[0]
    classes = CLS_BUNDLE["classes"]
    ranked = sorted(
        [{"role": c, "probability": round(float(p) * 100, 2)} for c, p in zip(classes, probs)],
        key=lambda x: x["probability"],
        reverse=True,
    )[:5]
    return {
        "predicted_role": pred,
        "top_probabilities": ranked,
        "blueprint": M3_META["blueprints"].get(pred),
    }


@app.get("/api/trends")
def get_trends():
    return M4


@app.get("/api/trends/verify")
def verify_trends(
    kind: Literal["skill", "role"] = Query("skill"),
    name: str = Query(...),
):
    bucket_key = "skills" if kind == "skill" else "roles"
    bucket = M4.get(bucket_key, {})
    if name not in bucket:
        raise HTTPException(status_code=404, detail=f"{kind.capitalize()} '{name}' not found in local trends.")

    cache_key = f"{kind}:{name}"
    if cache_key in TREND_VERIFY_CACHE:
        return TREND_VERIFY_CACHE[cache_key]

    local_series = bucket[name].get("series") or []
    result = _verify_series_with_gemini(kind, name, local_series)
    TREND_VERIFY_CACHE[cache_key] = result
    return result


@app.get("/api/forecast")
def get_forecast():
    return M5


@app.get("/api/companies")
def get_companies():
    return ADDON