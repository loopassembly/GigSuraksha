from __future__ import annotations

from typing import Any

from app.utils.ids import generate_readable_id
from app.utils.time import utcnow


def build_simulated_payout(
    *,
    worker: dict[str, Any],
    payout_amount: float,
) -> dict[str, Any]:
    processed_at = utcnow()
    upi_id = str(worker.get("upi_id") or "").strip()
    if not upi_id:
        return {
            "payout_status": "failed",
            "payout_channel": None,
            "payout_reference": None,
            "payout_processed_at": None,
            "payout_amount": round(payout_amount, 2),
            "payout_metadata": {
                "processor": "upi_simulator",
                "message": "Worker UPI handle missing",
            },
        }

    return {
        "payout_status": "processed",
        "payout_channel": "upi_simulated",
        "payout_reference": generate_readable_id("pay"),
        "payout_processed_at": processed_at,
        "payout_amount": round(payout_amount, 2),
        "payout_metadata": {
            "processor": "upi_simulator",
            "destination_upi_id": upi_id,
            "message": "Instant payout simulated successfully",
        },
    }
