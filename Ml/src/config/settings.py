from __future__ import annotations

from datetime import date, timedelta

TIMEZONE = "Asia/Kolkata"
DEFAULT_HISTORY_START = "2023-01-01"
MODEL_VERSION = "weekly-disruption-risk-v1"
RANDOM_SEED = 42

HEAVY_RAIN_THRESHOLD_MM = 20.0
FLOOD_ROLLING_6H_THRESHOLD_MM = 60.0
ACCESS_RAIN_THRESHOLD_MM = 12.0
ACCESS_RISK_THRESHOLD = 0.55
HEAT_TEMP_THRESHOLD_C = 40.0
HEAT_APPARENT_THRESHOLD_C = 45.0
SEVERE_PM25_THRESHOLD = 90.0
SEVERE_US_AQI_THRESHOLD = 200.0
SEVERE_WIND_GUST_THRESHOLD_KMH = 50.0

RISK_SCORE_REFERENCE_HOURS = 8.0
RISK_BAND_THRESHOLDS = {
    "LOW": 30,
    "MEDIUM": 60,
}
ML_RISK_LOADING_BY_BAND = {
    "LOW": 3,
    "MEDIUM": 8,
    "HIGH": 12,
}


def latest_complete_sunday(reference_date: date | None = None) -> date:
    reference_date = reference_date or date.today()
    days_since_sunday = (reference_date.weekday() + 1) % 7
    candidate = reference_date - timedelta(days=days_since_sunday)
    if candidate >= reference_date:
        candidate -= timedelta(days=7)
    return candidate


def default_history_end(reference_date: date | None = None) -> str:
    return latest_complete_sunday(reference_date).isoformat()
