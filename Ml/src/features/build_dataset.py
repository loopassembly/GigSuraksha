from __future__ import annotations

import argparse
from pathlib import Path

from src.portable_ml import build_training_dataset_from_file
from src.utils.paths import PROCESSED_CITY_HOURLY_PATH, PROCESSED_WEEKLY_DATASET_PATH


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the weekly tabular training dataset.")
    parser.add_argument("--source", default=str(PROCESSED_CITY_HOURLY_PATH))
    parser.add_argument("--output", default=str(PROCESSED_WEEKLY_DATASET_PATH))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    build_training_dataset_from_file(source=Path(args.source), output=Path(args.output))
    print(f"Saved weekly training dataset to {args.output}")


if __name__ == "__main__":
    main()
