from __future__ import annotations

import json
from collections import Counter
from typing import Any

from app.config import DEMO_REQUESTS_PATH
from app.repositories.claims import ClaimRepository
from app.repositories.events import EventRepository
from app.repositories.policies import PolicyRepository
from app.repositories.workers import WorkerRepository
from app.services.claim_service import serialize_claim
from app.services.event_service import serialize_event
from app.services.quote_service import generate_quote
from app.utils.time import utcnow


def _quote_to_forecast_card(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "city": item["worker_profile"]["city"],
        "zone": item["worker_profile"]["zone"],
        "shift_type": item["worker_profile"]["shift_type"],
        "coverage_tier": item["worker_profile"]["coverage_tier"],
        "risk_band": item["risk_summary"]["risk_band"],
        "risk_score": item["risk_summary"]["risk_score"],
        "expected_disrupted_hours": item["risk_summary"]["expected_disrupted_hours"],
        "suggested_weekly_premium": item["premium_breakdown"]["final_weekly_premium"],
        "model_version": item["model_version"],
    }


def _build_demo_forecast_cards() -> list[dict[str, Any]]:
    if not DEMO_REQUESTS_PATH.exists():
        return []
    requests = json.loads(DEMO_REQUESTS_PATH.read_text(encoding="utf-8"))
    cards: list[dict[str, Any]] = []
    reference_date = utcnow().date().isoformat()
    for request in requests:
        quote = generate_quote(
            worker_profile=request["worker_profile"],
            feature_context={"reference_date": reference_date},
        )
        cards.append(_quote_to_forecast_card(quote))
    return cards


async def _load_forecast_cards(database: Any) -> list[dict[str, Any]]:
    active_policies = await PolicyRepository(database).list_active()
    cards: list[dict[str, Any]] = []
    reference_date = utcnow().date().isoformat()
    for policy in active_policies[:4]:
        quote = generate_quote(
            worker_profile={
                "city": policy["city"],
                "zone": policy["zone"],
                "shift_type": policy["shift_type"],
                "coverage_tier": policy["coverage_tier"],
                "weekly_earnings": policy["weekly_earnings"],
                "weekly_active_hours": policy["weekly_active_hours"],
            },
            feature_context={"reference_date": reference_date},
        )
        cards.append(_quote_to_forecast_card(quote))
    if cards:
        return cards
    return _build_demo_forecast_cards()


def _normalize_recent_claims(claims: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for claim in claims:
        normalized.append(serialize_claim(claim))
    return normalized


def _normalize_recent_events(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for event in events:
        normalized.append(serialize_event(event))
    return normalized


async def get_admin_summary(database: Any) -> dict[str, Any]:
    worker_repository = WorkerRepository(database)
    policy_repository = PolicyRepository(database)
    event_repository = EventRepository(database)
    claim_repository = ClaimRepository(database)

    recent_events_raw = await event_repository.list_recent(limit=5)
    recent_claims_raw = await claim_repository.list_all(limit=5)
    all_claims_raw = await claim_repository.list_all()

    claims_by_status = Counter(claim["status"] for claim in all_claims_raw)
    claims_by_event_type = Counter(claim["event_type"] for claim in all_claims_raw)

    return {
        "total_workers": await worker_repository.count(),
        "total_active_policies": await policy_repository.count_active(),
        "total_events": await event_repository.count(),
        "total_claims": await claim_repository.count(),
        "claims_by_status": dict(claims_by_status),
        "claims_by_event_type": dict(claims_by_event_type),
        "recent_events": _normalize_recent_events(recent_events_raw),
        "recent_claims": _normalize_recent_claims(recent_claims_raw),
        "forecast_cards": await _load_forecast_cards(database),
    }
