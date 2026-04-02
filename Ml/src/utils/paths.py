from __future__ import annotations

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
EXTERNAL_DIR = DATA_DIR / "external"
MODELS_DIR = ROOT_DIR / "models"
REPORTS_DIR = ROOT_DIR / "reports"
NOTEBOOKS_DIR = ROOT_DIR / "notebooks"

RAW_OPEN_METEO_DIR = RAW_DIR / "open_meteo"
PROCESSED_CITY_HOURLY_PATH = PROCESSED_DIR / "city_hourly_environment.csv"
PROCESSED_WEEKLY_DATASET_PATH = PROCESSED_DIR / "weekly_risk_training_dataset.csv"
ZONE_METADATA_EXPORT_PATH = EXTERNAL_DIR / "zone_metadata.csv"
MODEL_ARTIFACT_PATH = MODELS_DIR / "weekly_disruption_risk_model.joblib"
METRICS_PATH = REPORTS_DIR / "metrics.json"
VALIDATION_PREDICTIONS_PATH = REPORTS_DIR / "validation_predictions.csv"
FEATURE_IMPORTANCE_PATH = REPORTS_DIR / "feature_importance.csv"
ACTUAL_VS_PREDICTED_PLOT_PATH = REPORTS_DIR / "actual_vs_predicted.svg"
MODEL_REPORT_PATH = REPORTS_DIR / "model_report.md"
BACKEND_HANDOFF_PATH = REPORTS_DIR / "backend_integration_contract.md"


def ensure_directories() -> None:
    for path in [
        RAW_DIR,
        PROCESSED_DIR,
        EXTERNAL_DIR,
        MODELS_DIR,
        REPORTS_DIR,
        NOTEBOOKS_DIR,
        RAW_OPEN_METEO_DIR,
    ]:
        path.mkdir(parents=True, exist_ok=True)
