from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from src.portable_ml import AIR_QUALITY_BASE_URL, WEATHER_BASE_URL, fetch_json


@dataclass(frozen=True)
class CityRequest:
    city: str
    latitude: float
    longitude: float
    start_date: str
    end_date: str


def fetch_weather_history(request: CityRequest) -> dict[str, Any]:
    return fetch_json(
        WEATHER_BASE_URL,
        {
            "latitude": request.latitude,
            "longitude": request.longitude,
            "start_date": request.start_date,
            "end_date": request.end_date,
            "hourly": "temperature_2m,apparent_temperature,precipitation,wind_gusts_10m",
            "timezone": "Asia/Kolkata",
        },
    )


def fetch_air_quality_history(request: CityRequest) -> dict[str, Any]:
    return fetch_json(
        AIR_QUALITY_BASE_URL,
        {
            "latitude": request.latitude,
            "longitude": request.longitude,
            "start_date": request.start_date,
            "end_date": request.end_date,
            "hourly": "pm2_5,us_aqi,european_aqi",
            "timezone": "Asia/Kolkata",
        },
    )
