from __future__ import annotations

from datetime import datetime, timedelta, timezone


def utcnow() -> datetime:
    return datetime.utcnow()


def normalize_utc_datetime(value: datetime) -> datetime:
    if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def ensure_datetime(value: datetime | None) -> datetime:
    if value is None:
        return utcnow()
    return normalize_utc_datetime(value)


def compute_week_window(valid_from: datetime | None) -> tuple[datetime, datetime]:
    start = ensure_datetime(valid_from)
    end = start + timedelta(days=7)
    return start, end


def intervals_overlap(
    start_a: datetime,
    end_a: datetime,
    start_b: datetime,
    end_b: datetime,
) -> float:
    start_a = normalize_utc_datetime(start_a)
    end_a = normalize_utc_datetime(end_a)
    start_b = normalize_utc_datetime(start_b)
    end_b = normalize_utc_datetime(end_b)
    latest_start = max(start_a, start_b)
    earliest_end = min(end_a, end_b)
    overlap_seconds = (earliest_end - latest_start).total_seconds()
    if overlap_seconds <= 0:
        return 0.0
    return round(overlap_seconds / 3600.0, 2)
