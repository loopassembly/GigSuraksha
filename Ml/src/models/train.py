from __future__ import annotations

import argparse
from pathlib import Path

from src.portable_ml import train_model_from_file
from src.utils.paths import (
    FEATURE_IMPORTANCE_PATH,
    METRICS_PATH,
    MODEL_ARTIFACT_PATH,
    PROCESSED_WEEKLY_DATASET_PATH,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train the weekly disruption risk regression model.")
    parser.add_argument("--dataset", default=str(PROCESSED_WEEKLY_DATASET_PATH))
    parser.add_argument("--model-output", default=str(MODEL_ARTIFACT_PATH))
    parser.add_argument("--metrics-output", default=str(METRICS_PATH))
    parser.add_argument("--feature-importance-output", default=str(FEATURE_IMPORTANCE_PATH))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    train_model_from_file(
        dataset_path=Path(args.dataset),
        artifact_path=Path(args.model_output),
        metrics_path=Path(args.metrics_output),
        feature_importance_path=Path(args.feature_importance_output),
    )
    print(f"Saved trained model artifact to {args.model_output}")
    print(f"Saved metrics summary to {args.metrics_output}")
    print(f"Saved feature importance report to {args.feature_importance_output}")


if __name__ == "__main__":
    main()
