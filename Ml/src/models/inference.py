from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from src.portable_ml import predict_weekly_risk
from src.utils.paths import MODEL_ARTIFACT_PATH


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run GigSuraksha weekly disruption risk inference.")
    parser.add_argument("--city", required=True)
    parser.add_argument("--zone", required=True)
    parser.add_argument("--shift-type", required=True)
    parser.add_argument("--coverage-tier", default="standard")
    parser.add_argument("--feature-context", default=None, help="Optional JSON string with engineered feature overrides.")
    parser.add_argument("--model", default=str(MODEL_ARTIFACT_PATH))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    feature_context: dict[str, Any] | None = json.loads(args.feature_context) if args.feature_context else None
    result = predict_weekly_risk(
        city=args.city,
        zone=args.zone,
        shift_type=args.shift_type,
        coverage_tier=args.coverage_tier,
        feature_context=feature_context,
        artifact_path=Path(args.model),
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
