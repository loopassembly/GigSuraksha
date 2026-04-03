from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from app.config import ANOMALY_BAND_THRESHOLDS
from app.repositories.claims import ClaimRepository
from app.repositories.workers import WorkerRepository


def anomaly_band_for_score(score: float) -> str:
    if score >= ANOMALY_BAND_THRESHOLDS["MEDIUM"]:
        return "HIGH"
    if score >= ANOMALY_BAND_THRESHOLDS["LOW"]:
        return "MEDIUM"
    return "LOW"


async def build_claim_integrity_summary(
    database: Any,
    *,
    worker: dict[str, Any],
    policy: dict[str, Any],
    event: dict[str, Any],
    validation_checks: dict[str, bool],
    payout_estimate: float,
) -> dict[str, Any]:
    claims_repository = ClaimRepository(database)
    worker_repository = WorkerRepository(database)

    same_upi_workers = await worker_repository.list_by_upi_id(worker["upi_id"])
    recent_claims = await claims_repository.list_all(limit=50)
    event_start = event["start_time"]
    zone_window_start = event_start - timedelta(minutes=45)
    zone_burst_claims = [
        claim
        for claim in recent_claims
        if claim["city"] == policy["city"]
        and claim["zone"] == policy["zone"]
        and zone_window_start <= claim["created_at"] <= event_start + timedelta(minutes=45)
    ]

    anomaly_score = 0.0
    anomaly_reasons: list[str] = []

    metadata = event.get("metadata") or {}
    location_confidence = float(metadata.get("location_confidence_score", 0.96))
    session_inconsistency = float(metadata.get("session_inconsistency_score", 0.08))
    activity_status = str(metadata.get("activity_status", "active_session_confirmed"))
    platform_session_valid = activity_status in {"active", "active_session_confirmed", "policy_bound_context"}
    location_zone = str(metadata.get("reported_zone", policy["zone"]))
    location_city = str(metadata.get("reported_city", policy["city"]))
    location_match = location_zone == policy["zone"] and location_city == policy["city"]

    if not platform_session_valid:
        anomaly_score += 0.28
        anomaly_reasons.append("activity session mismatch")
    if not location_match:
        anomaly_score += 0.35
        anomaly_reasons.append("reported location mismatch")
    if location_confidence < 0.7:
        anomaly_score += 0.18
        anomaly_reasons.append("low location confidence")
    if session_inconsistency > 0.5:
        anomaly_score += 0.18
        anomaly_reasons.append("high session inconsistency")
    if len(zone_burst_claims) >= 3:
        anomaly_score += 0.12
        anomaly_reasons.append("burst claims in insured zone")
    if len({entry["worker_id"] for entry in same_upi_workers}) >= 2:
        anomaly_score += 0.12
        anomaly_reasons.append("shared payout handle across workers")
    if payout_estimate >= float(policy["coverage_summary"]["max_weekly_payout"]) * 0.9:
        anomaly_score += 0.06
        anomaly_reasons.append("claim near weekly payout cap")
    if worker["created_at"] >= event_start - timedelta(hours=12):
        anomaly_score += 0.08
        anomaly_reasons.append("very recent worker registration")

    anomaly_score = min(round(anomaly_score, 2), 1.0)

    return {
        "validation_checks": {
            **validation_checks,
            "location_match": location_match,
            "activity_validation": platform_session_valid,
        },
        "anomaly_score": anomaly_score,
        "anomaly_band": anomaly_band_for_score(anomaly_score),
        "anomaly_reasons": anomaly_reasons or ["no unusual claim signals detected"],
        "activity_snapshot": {
            "location_confidence_score": round(location_confidence, 2),
            "session_inconsistency_score": round(session_inconsistency, 2),
            "activity_status": activity_status,
            "reported_city": location_city,
            "reported_zone": location_zone,
            "peer_burst_claim_count": len(zone_burst_claims),
            "shared_upi_worker_count": len({entry["worker_id"] for entry in same_upi_workers}),
        },
    }
