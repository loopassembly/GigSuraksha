import type {
  AdminSummary,
  ApiErrorShape,
  BackendClaim,
  BackendClaimsResponse,
  BackendEventSimulationResponse,
  BackendPolicy,
  BackendPoliciesResponse,
  BackendQuoteResponse,
  TriggerMonitorRunResponse,
  BackendWorker,
  BackendShiftType,
  CoverageTierId,
} from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'https://gigsuraksha-backend.fly.dev';

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let payload: ApiErrorShape | null = null;
    try {
      payload = (await response.json()) as ApiErrorShape;
    } catch {
      payload = null;
    }
    const detail = formatErrorDetail(payload?.detail) || payload?.message || `Request failed with status ${response.status}`;
    throw new ApiError(detail, response.status, detail);
  }

  return (await response.json()) as T;
}

function formatErrorDetail(detail: unknown): string | undefined {
  if (!detail) {
    return undefined;
  }
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object') {
          const message = 'msg' in item ? String(item.msg) : 'Validation error';
          const location = Array.isArray((item as { loc?: unknown[] }).loc)
            ? (item as { loc?: unknown[] }).loc?.filter(Boolean).join(' > ')
            : '';
          return location ? `${location}: ${message}` : message;
        }
        return String(item);
      })
      .join('; ');
  }
  return String(detail);
}

export function checkHealth() {
  return request<{ status: string }>('/health');
}

export function registerWorker(data: {
  name: string;
  phone: string;
  city: string;
  platform: string;
  zone: string;
  shift_type: BackendShiftType;
  weekly_earnings: number;
  weekly_active_hours: number;
  upi_id: string;
}) {
  return request<BackendWorker>('/api/workers/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getWorker(workerId: string) {
  return request<BackendWorker>(`/api/workers/${workerId}`);
}

export function generateQuote(payload: {
  worker_profile: {
    city: string;
    zone: string;
    shift_type: BackendShiftType;
    coverage_tier: CoverageTierId;
    weekly_earnings: number;
    weekly_active_hours: number;
  };
  feature_context?: Record<string, unknown>;
}) {
  return request<BackendQuoteResponse>('/api/quote/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createPolicy(payload: {
  worker_id?: string;
  coverage_tier?: CoverageTierId;
  worker_profile?: {
    city: string;
    zone: string;
    shift_type: BackendShiftType;
    coverage_tier: CoverageTierId;
    weekly_earnings: number;
    weekly_active_hours: number;
  };
  feature_context?: Record<string, unknown>;
  valid_from?: string;
}) {
  return request<BackendPolicy>('/api/policies/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getPolicy(policyId: string) {
  return request<BackendPolicy>(`/api/policies/${policyId}`);
}

export async function getWorkerPolicies(workerId: string) {
  const response = await request<BackendPoliciesResponse>(`/api/policies/worker/${workerId}`);
  return response.policies;
}

export function simulateEvent(payload: {
  event_type: string;
  city: string;
  zone: string;
  severity: string;
  start_time: string;
  duration_hours: number;
  source: string;
  verified: boolean;
  metadata?: Record<string, unknown>;
}) {
  return request<BackendEventSimulationResponse>('/api/events/simulate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getClaim(claimId: string) {
  return request<BackendClaim>(`/api/claims/${claimId}`);
}

export async function getWorkerClaims(workerId: string) {
  const response = await request<BackendClaimsResponse>(`/api/claims/worker/${workerId}`);
  return response.claims;
}

export async function getAllClaims() {
  const response = await request<BackendClaimsResponse>('/api/claims');
  return response.claims;
}

export function getAdminSummary() {
  return request<AdminSummary>('/api/admin/summary');
}

export function runTriggerMonitor(payload?: {
  reference_time?: string;
  sources?: string[];
  dry_run?: boolean;
}) {
  return request<TriggerMonitorRunResponse>('/api/triggers/monitor/run', {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  });
}

export { API_BASE_URL };
