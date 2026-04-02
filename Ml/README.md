# GigSuraksha ML Module

This module trains and serves the **weekly disruption risk model** for GigSuraksha’s income-protection pricing engine. The target is:

- `expected_disrupted_hours_next_week`

For each `(city, zone, shift_type)` combination, the model outputs:

- `expected_disrupted_hours`
- `risk_score` (0-100)
- `risk_band` (`LOW` / `MEDIUM` / `HIGH`)
- `premium_loading`

## What This Module Does

1. Fetches hourly historical weather and air-quality data from Open-Meteo.
2. Builds weekly city-zone-shift training rows with interpretable engineered features.
3. Trains a production-ready regression model for next-week disrupted hours.
4. Converts the model output into deterministic premium inputs for backend pricing.

## Data Sources

- Open-Meteo Historical Weather API
- Open-Meteo Air Quality API
- Manual zone priors for demo zones such as Koramangala, Andheri East, Gurgaon Sec 49, Anna Nagar, and Banjara Hills

## Proxy Label Design

Because insurer-grade claims labels do not exist yet, the supervised target is a **rule-derived proxy**:

- heavy rain: `precipitation >= 20 mm/hour`
- flood proxy: rolling 6-hour rain `>= 60 mm` in flood-prone zones
- heat stress: `temperature >= 40 C` or `apparent_temperature >= 45 C`
- severe pollution: PM2.5 / AQI above a severe threshold, adjusted by zone AQI sensitivity
- severe wind: `wind_gusts_10m >= 50 km/h`

These hourly disruption flags are aggregated into weekly disrupted hours per zone and shift.

## Project Layout

```text
Ml/
├── data/
│   ├── raw/
│   ├── processed/
│   └── external/
├── notebooks/
│   └── eda.ipynb
├── src/
│   ├── config/
│   ├── data/
│   ├── features/
│   ├── models/
│   ├── utils/
│   ├── pipeline.py
│   └── portable_ml.py
├── models/
├── reports/
├── requirements.txt
└── README.md
```

## How To Run

Use the system Python on this machine:

```bash
cd /Users/loopassembly/Desktop/GigSuraksha/Ml
/usr/bin/python3 -m src.pipeline --start-date 2023-01-01 --end-date 2026-03-29
```

Or run the steps individually:

```bash
cd /Users/loopassembly/Desktop/GigSuraksha/Ml
/usr/bin/python3 -m src.data.fetch_data --start-date 2023-01-01 --end-date 2026-03-29
/usr/bin/python3 -m src.features.build_dataset
/usr/bin/python3 -m src.models.train
/usr/bin/python3 -m src.models.evaluate
```

## Inference Example

```bash
cd /Users/loopassembly/Desktop/GigSuraksha/Ml
/usr/bin/python3 -m src.models.inference \
  --city Gurugram \
  --zone "Gurgaon Sec 49" \
  --shift-type late_night \
  --coverage-tier standard \
  --feature-context '{"reference_date": "2026-01-20"}'
```

Example output:

```json
{
  "risk_score": 100,
  "risk_band": "HIGH",
  "expected_disrupted_hours": 20.0,
  "premium_loading": 12,
  "premium_breakdown_hint": {
    "ml_risk_loading": 12
  }
}
```

## Current Artifact Summary

- Model artifact: [`/Users/loopassembly/Desktop/GigSuraksha/Ml/models/weekly_disruption_risk_model.joblib`](/Users/loopassembly/Desktop/GigSuraksha/Ml/models/weekly_disruption_risk_model.joblib)
- Metrics: [`/Users/loopassembly/Desktop/GigSuraksha/Ml/reports/metrics.json`](/Users/loopassembly/Desktop/GigSuraksha/Ml/reports/metrics.json)
- Model report: [`/Users/loopassembly/Desktop/GigSuraksha/Ml/reports/model_report.md`](/Users/loopassembly/Desktop/GigSuraksha/Ml/reports/model_report.md)
- Backend contract: [`/Users/loopassembly/Desktop/GigSuraksha/Ml/reports/backend_integration_contract.md`](/Users/loopassembly/Desktop/GigSuraksha/Ml/reports/backend_integration_contract.md)

## Important Note

The repo still lists the preferred `pandas` / `scikit-learn` / `xgboost` stack in `requirements.txt`. On this specific machine, compiled Python extensions were blocked by local macOS code-signing policy, so the checked-in artifact was trained with the **portable pure-Python fallback** in [`/Users/loopassembly/Desktop/GigSuraksha/Ml/src/portable_ml.py`](/Users/loopassembly/Desktop/GigSuraksha/Ml/src/portable_ml.py). This keeps the deliverable honest, reproducible, and runnable in the current hackathon environment.
