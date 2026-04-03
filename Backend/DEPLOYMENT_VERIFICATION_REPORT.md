# GigSuraksha Deployment Verification Report

Date: 2026-04-03  
Target backend: `https://gigsuraksha-backend.fly.dev`  
Scope: deployment verification for frontend integration readiness

## Executive Summary

The deployed GigSuraksha backend is ready for frontend integration.

Overall result:

- Persistence: confirmed MongoDB persistence is active
- CORS: verified for the real frontend dev origin and browser-style requests
- Phase 2 flow: passed end to end on the deployed Fly app

No deployment blocker was found for:

- worker registration
- ML-backed quote generation
- policy creation
- event simulation
- automatic claim creation
- worker claim retrieval
- admin summary

One non-blocking note:

- `forecast_cards` in admin summary are still seeded demo cards rather than live-generated forecast data

## Environment Verified

- Backend framework: FastAPI
- Deployment target: Fly.io
- Base URL: `https://gigsuraksha-backend.fly.dev`
- Persistence target: MongoDB Atlas via deployed `MONGODB_URI` secret
- Frontend project: Next.js

## Step 1: Persistence Verification

### Goal

Verify that the deployed backend is truly using MongoDB persistence and not an in-memory fallback.

### Worker Registration Payload Used

```json
{
  "name": "Ravi Kumar QA 100433",
  "phone": "9000100433",
  "city": "Bengaluru",
  "platform": "Blinkit",
  "zone": "Koramangala",
  "shift_type": "evening_rush",
  "weekly_earnings": 6000,
  "weekly_active_hours": 40,
  "upi_id": "ravi100433@oksbi"
}
```

### Persistence Test Sequence

1. `POST /api/workers/register`
2. Captured returned `worker_id`
3. `GET /api/workers/{worker_id}`
4. `POST /api/policies/create`
5. `GET /api/policies/worker/{worker_id}`
6. Stopped the active Fly machine
7. Let Fly cold-start a different machine
8. Re-fetched the same worker and policy after restart

### Results

- `POST /api/workers/register` -> `200`
- created `worker_id`: `wrk_20260403100433_9ee4`
- `GET /api/workers/wrk_20260403100433_9ee4` -> `200`
- `POST /api/policies/create` -> `200`
- created `policy_id`: `pol_20260403100437_4e75`
- `GET /api/policies/worker/wrk_20260403100433_9ee4` -> `200`

### Restart-Safe Validation

Fly machine evidence:

- started machine before stop: `68376eea151e58`
- manually stopped machine: `68376eea151e58`
- health came back on a different machine: `8e4619a7779448`

After the machine switch:

- `GET /api/workers/wrk_20260403100433_9ee4` -> `200`
- `GET /api/policies/worker/wrk_20260403100433_9ee4` -> `200`

The same worker and policy were still present after the app came back on a different Fly machine.

### Additional Evidence

- `flyctl secrets list -a gigsuraksha-backend` showed deployed secret:
  - `MONGODB_URI`
- `flyctl machine list -a gigsuraksha-backend --json` showed normal machine rotation and cold-start behavior
- the persisted records survived beyond one request lifecycle and beyond one machine lifecycle

### Conclusion

Conclusion for Step 1:

- confirmed MongoDB persistence is active

Reason:

- an in-memory fallback would not have preserved the worker and policy after the active Fly machine was explicitly stopped and a different machine served the next request

## Step 2: CORS Verification

### Frontend Origin Detection

Frontend files inspected:

- `frontend/package.json`
- `frontend/next.config.ts`

Findings:

- `package.json` uses `next dev`
- `next.config.ts` has no custom port override

Detected local frontend dev origin:

- `http://localhost:3000`

Also verified alternate local loopback origin:

- `http://127.0.0.1:3000`

Additional browser-style test origin:

- `https://demo-frontend.example`

### Routes Tested

- `POST /api/quote/generate`
- `POST /api/workers/register`

### Test Method

For each origin and endpoint:

1. sent browser-style CORS preflight `OPTIONS`
2. sent actual `POST` request with `Origin` header
3. checked:
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Methods`
   - `Access-Control-Allow-Headers`
   - `Access-Control-Allow-Credentials`

### Results

For `http://localhost:3000`:

- `/api/quote/generate` preflight -> `200`
- `/api/quote/generate` POST -> `200`
- `/api/workers/register` preflight -> `200`
- `/api/workers/register` POST -> `200`
- `Access-Control-Allow-Origin` echoed `http://localhost:3000`

For `http://127.0.0.1:3000`:

- `/api/quote/generate` preflight -> `200`
- `/api/quote/generate` POST -> `200`
- `/api/workers/register` preflight -> `200`
- `/api/workers/register` POST -> `200`
- `Access-Control-Allow-Origin` echoed `http://127.0.0.1:3000`

For `https://demo-frontend.example`:

- `/api/quote/generate` preflight -> `200`
- `/api/quote/generate` POST -> `200`
- `/api/workers/register` preflight -> `200`
- `/api/workers/register` POST -> `200`
- `Access-Control-Allow-Origin` echoed `https://demo-frontend.example`

Additional header check:

- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: content-type`
- `Access-Control-Allow-Credentials: true`

### Conclusion

Conclusion for Step 2:

- frontend can proceed without CORS blockers

Current behavior:

- the deployed backend is demo-permissive and effectively accepts arbitrary origins
- this is suitable for hackathon/demo integration
- it should be tightened later for production

## Step 3: True Deployed End-to-End Flow

### Persona Used

```json
{
  "name": "Ravi Kumar QA 100433",
  "phone": "9000100433",
  "city": "Bengaluru",
  "platform": "Blinkit",
  "zone": "Koramangala",
  "shift_type": "evening_rush",
  "weekly_earnings": 6000,
  "weekly_active_hours": 40,
  "upi_id": "ravi100433@oksbi"
}
```

### Sequence Run Against Fly.io

1. `POST /api/workers/register`
2. `POST /api/quote/generate`
3. `POST /api/policies/create`
4. `POST /api/events/simulate`
5. `GET /api/claims/worker/{worker_id}`
6. `GET /api/admin/summary`

### Results

#### 1. Worker registration

- route: `POST /api/workers/register`
- status: `200`
- `worker_id`: `wrk_20260403100433_9ee4`

#### 2. Quote generation

- route: `POST /api/quote/generate`
- status: `200`
- `model_version`: `weekly-disruption-risk-v1`
- risk band: `LOW`
- expected disrupted hours: `0.02`
- final weekly premium: `52`

#### 3. Policy creation

- route: `POST /api/policies/create`
- status: `200`
- `policy_id`: `pol_20260403100437_4e75`
- policy status: `active`

#### 4. Event simulation

Event payload used:

```json
{
  "event_type": "heavy_rainfall",
  "city": "Bengaluru",
  "zone": "Koramangala",
  "severity": "high",
  "start_time": "2026-04-03T19:00:00",
  "duration_hours": 3,
  "source": "qa_verification",
  "verified": true,
  "metadata": {
    "test_run": "100433"
  }
}
```

Result:

- route: `POST /api/events/simulate`
- status: `200`
- `event_id`: `evt_20260403100444_600e`
- `claims_created`: `1`

#### 5. Worker claim retrieval

- route: `GET /api/claims/worker/wrk_20260403100433_9ee4`
- status: `200`
- returned `claim_id`: `clm_20260403100444_2d2b`
- payout estimate: `382.5`
- claim status: `approved`

#### 6. Admin summary

- route: `GET /api/admin/summary`
- status: `200`

Admin summary during the end-to-end run showed:

- `total_workers = 1`
- `total_active_policies = 1`
- `total_events = 1`
- `total_claims = 1`

Later live totals were higher because additional verification calls created extra test workers:

- `total_workers = 4`
- `total_active_policies = 1`
- `total_events = 1`
- `total_claims = 1`

That is expected and not a backend issue.

### Conclusion

Conclusion for Step 3:

- the deployed Phase 2 backend flow passed end to end

## Issue Classification

No critical issues found.

No failure was observed in these categories:

- configuration issue
- deployment issue
- persistence issue
- CORS issue
- schema/contract mismatch

Non-blocking observation:

- admin `forecast_cards` are still seeded/static demo cards rather than live-generated forecast outputs

## Final QA Verdict

The deployed backend is ready for frontend integration.

Final status:

- MongoDB persistence: verified
- CORS for frontend/browser requests: verified
- deployed API flow: verified
- ML-backed quote generation: verified

Recommended frontend base URL:

- `https://gigsuraksha-backend.fly.dev`
