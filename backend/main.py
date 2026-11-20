import os
import json
import joblib
from scipy.sparse import hstack
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Indian IT Labour Market Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "web_app_data")

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


class ClassifyRequest(BaseModel):
    text: str
    model_name: str = "Logistic Regression"


@app.get("/")
def health_check():
    return {"status": "running", "project": "Indian IT Labour Market Intelligence System"}


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


@app.get("/api/forecast")
def get_forecast():
    return M5


@app.get("/api/companies")
def get_companies():
    return ADDON