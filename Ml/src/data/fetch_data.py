from __future__ import annotations

import argparse

from src.config.settings import DEFAULT_HISTORY_START, default_history_end
from src.portable_ml import fetch_all_history


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch historical weather and AQI data from Open-Meteo.")
    parser.add_argument("--start-date", default=DEFAULT_HISTORY_START)
    parser.add_argument("--end-date", default=default_history_end())
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    fetch_all_history(start_date=args.start_date, end_date=args.end_date)


if __name__ == "__main__":
    main()
