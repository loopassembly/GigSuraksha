from __future__ import annotations

CITY_METADATA = {
    "Bengaluru": {
        "latitude": 12.9716,
        "longitude": 77.5946,
        "monsoon_months": [6, 7, 8, 9, 10],
        "aliases": ["Bangalore"],
    },
    "Mumbai": {
        "latitude": 19.0760,
        "longitude": 72.8777,
        "monsoon_months": [6, 7, 8, 9],
        "aliases": [],
    },
    "Delhi": {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "monsoon_months": [7, 8, 9],
        "aliases": ["Delhi NCR", "New Delhi"],
    },
    "Gurugram": {
        "latitude": 28.4595,
        "longitude": 77.0266,
        "monsoon_months": [7, 8, 9],
        "aliases": ["Gurgaon", "Gurugram / Gurgaon"],
    },
    "Chennai": {
        "latitude": 13.0827,
        "longitude": 80.2707,
        "monsoon_months": [10, 11, 12],
        "aliases": [],
    },
    "Hyderabad": {
        "latitude": 17.3850,
        "longitude": 78.4867,
        "monsoon_months": [6, 7, 8, 9],
        "aliases": [],
    },
    "Pune": {
        "latitude": 18.5204,
        "longitude": 73.8567,
        "monsoon_months": [6, 7, 8, 9],
        "aliases": [],
    },
    "Kolkata": {
        "latitude": 22.5726,
        "longitude": 88.3639,
        "monsoon_months": [6, 7, 8, 9],
        "aliases": ["Calcutta"],
    },
}

ZONE_METADATA = {
    "Koramangala": {
        "city": "Bengaluru",
        "flood_prone_score": 0.55,
        "aqi_sensitivity_score": 0.34,
        "zone_access_risk_score": 0.46,
        "safe_zone_discount_hint": 1,
    },
    "Indiranagar": {
        "city": "Bengaluru",
        "flood_prone_score": 0.28,
        "aqi_sensitivity_score": 0.30,
        "zone_access_risk_score": 0.30,
        "safe_zone_discount_hint": 4,
    },
    "HSR Layout": {
        "city": "Bengaluru",
        "flood_prone_score": 0.48,
        "aqi_sensitivity_score": 0.33,
        "zone_access_risk_score": 0.41,
        "safe_zone_discount_hint": 2,
    },
    "Whitefield": {
        "city": "Bengaluru",
        "flood_prone_score": 0.52,
        "aqi_sensitivity_score": 0.37,
        "zone_access_risk_score": 0.53,
        "safe_zone_discount_hint": 1,
    },
    "Andheri East": {
        "city": "Mumbai",
        "flood_prone_score": 0.82,
        "aqi_sensitivity_score": 0.42,
        "zone_access_risk_score": 0.73,
        "safe_zone_discount_hint": 0,
    },
    "Powai": {
        "city": "Mumbai",
        "flood_prone_score": 0.64,
        "aqi_sensitivity_score": 0.38,
        "zone_access_risk_score": 0.51,
        "safe_zone_discount_hint": 1,
    },
    "Bandra West": {
        "city": "Mumbai",
        "flood_prone_score": 0.50,
        "aqi_sensitivity_score": 0.36,
        "zone_access_risk_score": 0.43,
        "safe_zone_discount_hint": 2,
    },
    "Dwarka": {
        "city": "Delhi",
        "flood_prone_score": 0.38,
        "aqi_sensitivity_score": 0.70,
        "zone_access_risk_score": 0.42,
        "safe_zone_discount_hint": 2,
    },
    "Rohini": {
        "city": "Delhi",
        "flood_prone_score": 0.31,
        "aqi_sensitivity_score": 0.72,
        "zone_access_risk_score": 0.37,
        "safe_zone_discount_hint": 2,
    },
    "Gurgaon Sec 49": {
        "city": "Gurugram",
        "flood_prone_score": 0.72,
        "aqi_sensitivity_score": 0.61,
        "zone_access_risk_score": 0.66,
        "safe_zone_discount_hint": 0,
    },
    "Cyber City": {
        "city": "Gurugram",
        "flood_prone_score": 0.44,
        "aqi_sensitivity_score": 0.58,
        "zone_access_risk_score": 0.49,
        "safe_zone_discount_hint": 1,
    },
    "Anna Nagar": {
        "city": "Chennai",
        "flood_prone_score": 0.58,
        "aqi_sensitivity_score": 0.26,
        "zone_access_risk_score": 0.43,
        "safe_zone_discount_hint": 2,
    },
    "Adyar": {
        "city": "Chennai",
        "flood_prone_score": 0.77,
        "aqi_sensitivity_score": 0.28,
        "zone_access_risk_score": 0.57,
        "safe_zone_discount_hint": 0,
    },
    "Banjara Hills": {
        "city": "Hyderabad",
        "flood_prone_score": 0.33,
        "aqi_sensitivity_score": 0.31,
        "zone_access_risk_score": 0.35,
        "safe_zone_discount_hint": 3,
    },
    "Gachibowli": {
        "city": "Hyderabad",
        "flood_prone_score": 0.41,
        "aqi_sensitivity_score": 0.30,
        "zone_access_risk_score": 0.39,
        "safe_zone_discount_hint": 3,
    },
    "Koregaon Park": {
        "city": "Pune",
        "flood_prone_score": 0.45,
        "aqi_sensitivity_score": 0.29,
        "zone_access_risk_score": 0.36,
        "safe_zone_discount_hint": 3,
    },
    "Salt Lake": {
        "city": "Kolkata",
        "flood_prone_score": 0.68,
        "aqi_sensitivity_score": 0.47,
        "zone_access_risk_score": 0.49,
        "safe_zone_discount_hint": 1,
    },
}

SHIFT_DEFINITIONS = {
    "morning_rush": {
        "label": "Morning Rush",
        "start_hour": 7,
        "end_hour": 11,
        "hours": [7, 8, 9, 10],
        "exposure_loading": 3,
    },
    "afternoon": {
        "label": "Afternoon",
        "start_hour": 12,
        "end_hour": 16,
        "hours": [12, 13, 14, 15],
        "exposure_loading": 2,
    },
    "evening_rush": {
        "label": "Evening Rush",
        "start_hour": 18,
        "end_hour": 22,
        "hours": [18, 19, 20, 21],
        "exposure_loading": 5,
    },
    "late_night": {
        "label": "Late Night",
        "start_hour": 22,
        "end_hour": 1,
        "hours": [22, 23, 0],
        "exposure_loading": 7,
    },
}

CITY_ALIASES = {
    alias: city
    for city, details in CITY_METADATA.items()
    for alias in details.get("aliases", [])
}

SHIFT_ALIASES = {
    "morning": "morning_rush",
    "morning rush": "morning_rush",
    "afternoon": "afternoon",
    "evening": "evening_rush",
    "evening rush": "evening_rush",
    "night": "late_night",
    "late night": "late_night",
}
