from __future__ import annotations

from typing import Iterable

from src.config.settings import (
    ML_RISK_LOADING_BY_BAND,
    RISK_BAND_THRESHOLDS,
    RISK_SCORE_REFERENCE_HOURS,
)


def expected_hours_to_risk_score(expected_disrupted_hours: float) -> int:
    score = int(round((max(expected_disrupted_hours, 0.0) / RISK_SCORE_REFERENCE_HOURS) * 100))
    return max(0, min(100, score))


def risk_score_to_band(risk_score: int) -> str:
    if risk_score <= RISK_BAND_THRESHOLDS["LOW"]:
        return "LOW"
    if risk_score <= RISK_BAND_THRESHOLDS["MEDIUM"]:
        return "MEDIUM"
    return "HIGH"


def expected_hours_to_band(expected_disrupted_hours: float) -> str:
    return risk_score_to_band(expected_hours_to_risk_score(expected_disrupted_hours))


def premium_loading_for_band(risk_band: str) -> int:
    return ML_RISK_LOADING_BY_BAND[risk_band]


def summarize_band_metrics(y_true: Iterable[float], y_pred: Iterable[float]) -> dict[str, float]:
    true_bands = [risk_score_to_band(expected_hours_to_risk_score(value)) for value in y_true]
    pred_bands = [risk_score_to_band(expected_hours_to_risk_score(value)) for value in y_pred]
    total = len(true_bands)
    accuracy = sum(1 for actual, predicted in zip(true_bands, pred_bands) if actual == predicted) / total if total else 0.0
    return {
        "risk_band_accuracy": round(accuracy, 4),
    }
