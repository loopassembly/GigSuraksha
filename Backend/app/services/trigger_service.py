from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Any

from app.config import MONITORED_TRIGGER_SOURCES
from app.repositories.events import EventRepository
from app.repositories.policies import PolicyRepository
from app.services.catalog import get_shift_profile, get_zone_profile
from app.services.event_service import simulate_event
from app.utils.ids import generate_readable_id
from app.utils.time import utcnow


def _stable_number(*parts: str) -> int:
    digest = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()
    return int(digest[:8], 16)


def _candidate_start_time(reference_time: datetime, hour: int) -> datetime:
    return reference_time.replace(hour=hour, minute=0, second=0, microsecond=0)


def _build_weather_candidate(policy: dict[str, Any], reference_time: datetime) -> dict[str, Any] | None:
    zone_profile = get_zone_profile(policy["zone"])
    shift_profile = get_shift_profile(policy["shift_type"])
    month = reference_time.month
    selector = _stable_number(policy["city"], policy["zone"], "weather", reference_time.date().isoformat()) % 100

    if month in {4, 5, 6} and selector % 3 == 0:
        return {
            "event_type": "heat_stress",
            "city": policy["city"],
            "zone": policy["zone"],
            "severity": "high" if selector % 2 == 0 else "moderate",
            "start_time": _candidate_start_time(reference_time, 13 if shift_profile["start_hour"] < 12 else shift_profile["start_hour"]),
            "duration_hours": 3.0,
            "source": "weather_mock",
            "verified": True,
            "metadata": {
                "integration_kind": "weather_api_mock",
                "trigger": "automated_monitor",
                "reported_city": policy["city"],
                "reported_zone": policy["zone"],
                "activity_status": "active_session_confirmed",
            },
        }

    if month in {6, 7, 8, 9} or zone_profile["zone_flood_prone_score"] >= 0.6:
        return {
            "event_type": "waterlogging" if zone_profile["zone_flood_prone_score"] >= 0.7 and selector % 2 == 0 else "heavy_rainfall",
            "city": policy["city"],
            "zone": policy["zone"],
            "severity": "high" if zone_profile["zone_flood_prone_score"] >= 0.6 else "moderate",
            "start_time": _candidate_start_time(reference_time, shift_profile["start_hour"]),
            "duration_hours": 3.0,
            "source": "weather_mock",
            "verified": True,
            "metadata": {
                "integration_kind": "weather_api_mock",
                "trigger": "automated_monitor",
                "reported_city": policy["city"],
                "reported_zone": policy["zone"],
                "activity_status": "active_session_confirmed",
            },
        }

    if month in {11, 12, 1, 2} and policy["city"] in {"Delhi", "Gurugram", "Mumbai"}:
        return {
            "event_type": "severe_aqi",
            "city": policy["city"],
            "zone": policy["zone"],
            "severity": "high" if selector % 2 == 0 else "moderate",
            "start_time": _candidate_start_time(reference_time, max(7, shift_profile["start_hour"])),
            "duration_hours": 4.0,
            "source": "weather_mock",
            "verified": True,
            "metadata": {
                "integration_kind": "air_quality_api_mock",
                "trigger": "automated_monitor",
                "reported_city": policy["city"],
                "reported_zone": policy["zone"],
                "activity_status": "active_session_confirmed",
            },
        }

    return None


def _build_traffic_candidate(policy: dict[str, Any], reference_time: datetime) -> dict[str, Any] | None:
    zone_profile = get_zone_profile(policy["zone"])
    if zone_profile["zone_access_risk_score"] < 0.42:
        return None
    shift_profile = get_shift_profile(policy["shift_type"])
    return {
        "event_type": "zone_access_restriction",
        "city": policy["city"],
        "zone": policy["zone"],
        "severity": "moderate" if zone_profile["zone_access_risk_score"] < 0.6 else "high",
        "start_time": _candidate_start_time(reference_time, shift_profile["start_hour"]),
        "duration_hours": 2.0,
        "source": "traffic_mock",
        "verified": True,
        "metadata": {
            "integration_kind": "traffic_api_mock",
            "trigger": "automated_monitor",
            "reported_city": policy["city"],
            "reported_zone": policy["zone"],
            "activity_status": "active_session_confirmed",
        },
    }


def _build_platform_candidate(policy: dict[str, Any], reference_time: datetime) -> dict[str, Any] | None:
    selector = _stable_number(policy["city"], policy["zone"], "platform", reference_time.date().isoformat()) % 10
    shift_profile = get_shift_profile(policy["shift_type"])
    event_type = "platform_outage" if selector < 5 else "dark_store_unavailable"
    return {
        "event_type": event_type,
        "city": policy["city"],
        "zone": policy["zone"],
        "severity": "moderate" if selector % 2 == 0 else "high",
        "start_time": _candidate_start_time(reference_time, shift_profile["start_hour"]),
        "duration_hours": 1.5,
        "source": "platform_mock",
        "verified": True,
        "metadata": {
            "integration_kind": "platform_api_mock",
            "trigger": "automated_monitor",
            "reported_city": policy["city"],
            "reported_zone": policy["zone"],
            "activity_status": "active_session_confirmed",
        },
    }


def _build_candidates_for_policy(policy: dict[str, Any], reference_time: datetime, sources: list[str]) -> list[dict[str, Any]]:
    source_builders = {
        "weather_mock": _build_weather_candidate,
        "traffic_mock": _build_traffic_candidate,
        "platform_mock": _build_platform_candidate,
    }
    candidates: list[dict[str, Any]] = []
    for source in sources:
        builder = source_builders[source]
        candidate = builder(policy, reference_time)
        if candidate is not None:
            candidates.append(candidate)
    return candidates


def _candidate_key(candidate: dict[str, Any]) -> tuple[str, str, str, str, str]:
    return (
        candidate["event_type"],
        candidate["city"],
        candidate["zone"],
        candidate["start_time"].isoformat(),
        candidate["source"],
    )


def _is_duplicate_event(candidate: dict[str, Any], existing_events: list[dict[str, Any]]) -> bool:
    candidate_key = _candidate_key(candidate)
    for event in existing_events:
        event_key = (
            event["event_type"],
            event["city"],
            event["zone"],
            event["start_time"].isoformat(),
            event["source"],
        )
        if event_key == candidate_key:
            return True
    return False


async def run_trigger_monitor(database: Any, payload: dict[str, Any]) -> dict[str, Any]:
    reference_time = payload.get("reference_time") or utcnow()
    dry_run = bool(payload.get("dry_run", False))
    requested_sources = payload.get("sources") or []
    sources = [source for source in requested_sources if source in MONITORED_TRIGGER_SOURCES] or list(MONITORED_TRIGGER_SOURCES)

    policies = await PolicyRepository(database).list_active()
    existing_events = await EventRepository(database).list_all(limit=100)

    unique_candidates: dict[tuple[str, str, str, str, str], dict[str, Any]] = {}
    for policy in policies:
        for candidate in _build_candidates_for_policy(policy, reference_time, sources):
            unique_candidates.setdefault(_candidate_key(candidate), candidate)

    candidate_events = list(unique_candidates.values())

    created_event_results: list[dict[str, Any]] = []
    claims_created = 0
    if not dry_run:
        for candidate in candidate_events:
            if _is_duplicate_event(candidate, existing_events):
                continue
            result = await simulate_event(database, candidate)
            created_event_results.append(result["event"])
            claims_created += int(result["claims_created"])
            existing_events.append(result["event"])

    return {
        "monitor_run_id": generate_readable_id("mon"),
        "reference_time": reference_time,
        "dry_run": dry_run,
        "sources_used": sources,
        "policies_scanned": len(policies),
        "candidate_events": candidate_events,
        "events_created": len(created_event_results),
        "claims_created": claims_created,
        "events": created_event_results,
    }
