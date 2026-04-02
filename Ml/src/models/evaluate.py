from __future__ import annotations

import argparse
from pathlib import Path

from src.portable_ml import evaluate_saved_model
from src.utils.paths import (
    ACTUAL_VS_PREDICTED_PLOT_PATH,
    METRICS_PATH,
    MODEL_ARTIFACT_PATH,
    PROCESSED_WEEKLY_DATASET_PATH,
    VALIDATION_PREDICTIONS_PATH,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate the trained GigSuraksha weekly risk model.")
    parser.add_argument("--dataset", default=str(PROCESSED_WEEKLY_DATASET_PATH))
    parser.add_argument("--model", default=str(MODEL_ARTIFACT_PATH))
    parser.add_argument("--predictions-output", default=str(VALIDATION_PREDICTIONS_PATH))
    parser.add_argument("--plot-output", default=str(ACTUAL_VS_PREDICTED_PLOT_PATH))
    parser.add_argument("--metrics-output", default=str(METRICS_PATH))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    evaluate_saved_model(
        dataset_path=Path(args.dataset),
        artifact_path=Path(args.model),
        predictions_path=Path(args.predictions_output),
        plot_path=Path(args.plot_output),
        metrics_path=Path(args.metrics_output),
    )
    print(f"Saved validation predictions to {args.predictions_output}")
    print(f"Saved evaluation plot to {args.plot_output}")


if __name__ == "__main__":
    main()
