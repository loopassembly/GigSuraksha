# GigSuraksha Weekly Disruption Risk Model Report

## Summary

- Target: `next_week_disrupted_hours`
- Modeling approach: portable ridge regression on engineered weekly city-zone-shift features
- Training label source: proxy disruption rules derived from public Open-Meteo hourly weather and air-quality history
- Model version: `weekly-disruption-risk-v1`

## Proxy Label Rules

An hour is marked disrupted when one or more of the following hold:

- precipitation >= 20.0 mm/hour
- rolling 6-hour precipitation >= 60.0 mm and the zone is flood-prone
- temperature >= 40.0 C or apparent temperature >= 45.0 C
- severe air quality based on PM2.5 / AQI threshold adjusted by zone AQI sensitivity
- severe wind gusts >= 50.0 km/h

## Validation Metrics

- MAE: 2.8871
- RMSE: 4.5323
- R2: 0.7313
- Risk-band accuracy: 0.7879

## Highest-Weight Features

- `severe_pollution_shift_hours_current_week` (2.814338)
- `disrupted_hours_current_week` (2.507596)
- `recent_disruption_hours_1w` (2.507596)
- `recent_disruption_hours_2w` (1.577618)
- `shift_type__evening_rush` (1.279023)

## Limitations

- Targets are rule-derived proxies, not insurer claim outcomes.
- Zone priors are manually assigned demo metadata for hackathon realism, not actuarial ground truth.
- A portable pure-Python regression fallback was used for the training run because compiled scientific Python packages were blocked by local macOS code-signing policy in this environment.
