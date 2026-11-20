# Indian IT Labour Market Intelligence System

An interactive, full-stack labour market intelligence platform (**React + Vite + Tailwind CSS + Recharts** frontend and **FastAPI** backend) built for role-based skill demand analysis, association rule mining, job-role classification, temporal trend tracking, 2026 forecasting, and historical company hiring exploration across the Indian IT job market (**2020–2026**).

---

## Key System Highlights

* **Multi-Portal Coverage (2020–2026):** Combines and deduplicates job postings across **Naukri**, **LinkedIn**, **Indeed**, and **Glassdoor** filtered to verified dates in **2020–2026** (**161,698** verified postings across `2020`–`2026`).
* **Canonical Taxonomy:**
  * **9 Standardized IT Roles:** `Software Developer`, `Data Scientist`, `Data Analyst`, `Business Analyst`, `Machine Learning Engineer`, `Data Engineer`, `Cloud & DevOps Engineer`, `QA & Test Engineer`, and `Cybersecurity Analyst`.
  * **65 Concrete Technical Skills & Tools:** Normalizes programming languages, data/ML libraries, databases, BI tools, cloud/DevOps stacks, testing/SDLC tools, and security skills while excluding broad umbrella domain labels.
* **5-Model Analytical Pipeline + Company Intelligence:**
  1. **Statistical Skill Demand:** Year-wise (`2020–2026`) and month-wise demand frequencies `F(s)` and shares `D(s)`, plus Top 10 skill rankings.
  2. **Role-Aware Apriori Association Rules:** Extracts co-occurring skill pairs (`X -> Y`) with **Support**, **Confidence**, and **Lift** across `All Roles` and individual IT roles.
  3. **Bidirectional Job-Role Classification:** Compares **Linear SVM** (`88.71%` accuracy, `88.78%` weighted F1, `88.04%` macro F1), **Logistic Regression** (`88.27%` accuracy, `88.38%` weighted F1, `87.42%` macro F1), and **Random Forest** (`83.49%` accuracy, `83.36%` weighted F1, `77.98%` macro F1) using field-weighted TF-IDF (`job_title` + `skills` + `description`), alongside role-to-skill blueprints.
  4. **Quantified Temporal Trends (2020–2026):** Tracks multi-year demand trajectories (`Increasing`, `Decreasing`, `Stable`) with year-over-year (YoY) volume and demand-share growth breakdowns for skills and roles.
  5. **2026 Time-Series Forecasting:** Validates **Lag-Feature Ridge Regression** (`MAPE: 3.96%`, `MAE: 8.23`, `RMSE: 9.27` on consistent portal volume) and **Holt-Winters Seasonal Smoothing** (`MAPE: 6.10%`, `MAE: 12.88`, `RMSE: 14.02`) against 2026 actuals across overall volume and key skill demand shares (`Python`, `SQL`, `AWS`, `Java`, `Power BI`, `Docker`).
  6. **Historical Company Hiring Analysis:** Surfaces historical posting counts, observed hiring windows, and primary locations per role (reflecting historical dataset records rather than live open vacancies).

---

## Project Structure

```text
IT_Market_Trend_Analysis/
├── .gitignore
├── README.md
├── web_app_data/
│   ├── addon_companies.json
│   ├── model1_skill_demand.json
│   ├── model2_apriori.json
│   ├── model3_classifiers.joblib
│   ├── model3_metadata.json
│   ├── model4_trends.json
│   └── model5_forecast.json
├── backend/
│   ├── requirements.txt
│   └── main.py
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── index.css
        └── App.jsx# IT_Market_Trend_Analysis
