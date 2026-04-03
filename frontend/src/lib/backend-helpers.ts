import {
  BACKEND_EVENT_TO_UI_TYPE,
  COVERAGE_TIER_NAME_MAP,
  DISRUPTION_TYPE_INFO,
  SHIFT_TYPE_LABELS,
  SHIFT_WINDOWS,
  ZONES,
} from './constants';
import type {
  BackendClaim,
  BackendClaimStatus,
  BackendEvent,
  BackendPolicy,
  BackendRiskBand,
  BackendShiftType,
  CoverageTierId,
  Severity,
  StoredWorker,
  Zone,
} from './types';

export function getReferenceDate() {
  return new Date().toISOString().slice(0, 10);
}

export function getPrimaryShiftId(shiftIds: string[]) {
  return SHIFT_WINDOWS.find((window) => shiftIds.includes(window.id))?.id ?? shiftIds[0] ?? 'evening';
}

export function getZoneById(zoneId: string) {
  return ZONES.find((zone) => zone.id === zoneId);
}

export function getShiftWindowById(shiftId: string) {
  return SHIFT_WINDOWS.find((window) => window.id === shiftId);
}

export function getShiftLabel(shiftType: BackendShiftType) {
  return SHIFT_TYPE_LABELS[shiftType] ?? shiftType.replace(/_/g, ' ');
}

export function getCoverageTierLabel(coverageTier: CoverageTierId) {
  return COVERAGE_TIER_NAME_MAP[coverageTier] ?? coverageTier;
}

export function buildQuotePayload(worker: StoredWorker, coverageTier: CoverageTierId) {
  return {
    worker_profile: {
      city: worker.backend_city,
      zone: worker.zone,
      shift_type: worker.shift_type,
      coverage_tier: coverageTier,
      weekly_earnings: worker.weekly_earnings,
      weekly_active_hours: worker.weekly_active_hours,
    },
    feature_context: {
      reference_date: getReferenceDate(),
    },
  };
}

export function buildPolicyPayload(worker: StoredWorker | null, coverageTier: CoverageTierId) {
  if (worker?.worker_id) {
    return {
      worker_id: worker.worker_id,
      coverage_tier: coverageTier,
      feature_context: {
        reference_date: getReferenceDate(),
      },
    };
  }

  if (!worker) {
    throw new Error('Worker details are missing.');
  }

  return {
    worker_profile: {
      city: worker.backend_city,
      zone: worker.zone,
      shift_type: worker.shift_type,
      coverage_tier: coverageTier,
      weekly_earnings: worker.weekly_earnings,
      weekly_active_hours: worker.weekly_active_hours,
    },
    feature_context: {
      reference_date: getReferenceDate(),
    },
  };
}

export function formatCurrencyValue(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startFormatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  }).format(start);
  const endFormatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(end);
  return `${startFormatted} - ${endFormatted}`;
}

export function formatRelativeHours(hours: number) {
  return `${formatNumber(hours, 1)}h`;
}

export function getRiskBadgeVariant(riskBand: BackendRiskBand) {
  if (riskBand === 'HIGH') {
    return 'danger';
  }
  if (riskBand === 'MEDIUM') {
    return 'warning';
  }
  return 'success';
}

export function getSeverityBadgeVariant(severity: Severity) {
  if (severity === 'severe') {
    return 'danger';
  }
  if (severity === 'high') {
    return 'warning';
  }
  return 'muted';
}

export function getClaimStatusBadgeVariant(status: BackendClaimStatus | string) {
  if (status === 'approved') {
    return 'success';
  }
  if (status === 'auto_initiated') {
    return 'warning';
  }
  if (status === 'rejected') {
    return 'danger';
  }
  return 'muted';
}

export function getPolicyStatusBadgeVariant(status: string) {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'expired') {
    return 'warning';
  }
  if (status === 'cancelled') {
    return 'danger';
  }
  return 'muted';
}

export function getEventInfo(eventType: string) {
  const uiType = BACKEND_EVENT_TO_UI_TYPE[eventType as keyof typeof BACKEND_EVENT_TO_UI_TYPE];
  if (uiType) {
    return DISRUPTION_TYPE_INFO[uiType];
  }
  return {
    label: startCase(eventType),
    category: 'WEATHER',
    isPayoutTrigger: true,
    description: startCase(eventType),
    icon: 'AlertTriangle',
  };
}

export function startCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function sortByCreatedAtDesc<T extends { created_at: string }>(items: T[]) {
  return [...items].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

export function getDriverStrengths(drivers: string[], riskScore: number) {
  return drivers.map((driver, index) => ({
    label: driver,
    score: Math.max(20, Math.min(100, riskScore - index * 10 || 35 + (drivers.length - index) * 10)),
  }));
}

export function describeValidationChecks(
  validationChecks: Record<string, boolean>,
  claim: BackendClaim
) {
  return [
    {
      id: 'policy_active',
      label: 'Policy Active',
      description: 'The policy was active when the disruption event occurred.',
      passed: Boolean(validationChecks.policy_active),
    },
    {
      id: 'zone_match',
      label: 'Zone Match',
      description: `Claim zone ${claim.zone} matches the insured policy location.`,
      passed: Boolean(validationChecks.zone_match),
    },
    {
      id: 'shift_overlap',
      label: 'Shift Overlap',
      description: `The event affected ${formatRelativeHours(claim.affected_hours)} of the insured shift.`,
      passed: Boolean(validationChecks.shift_overlap),
    },
    {
      id: 'event_verified',
      label: 'Event Verified',
      description: 'The disruption was marked verified by the backend trigger pipeline.',
      passed: Boolean(validationChecks.event_verified),
    },
    {
      id: 'duplicate_claim',
      label: 'Duplicate Check',
      description: 'No duplicate claim was detected for the same policy and event.',
      passed: !validationChecks.duplicate_claim,
    },
  ];
}

export function getDefaultSimulationZone(worker: StoredWorker | null): Zone {
  return (
    (worker ? getZoneById(worker.zone_id) : null) ??
    ZONES.find((zone) => zone.apiSupported) ??
    ZONES[0]
  );
}

export function toLocalDateTimeInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function getClaimTimelineStatus(claim: BackendClaim | null) {
  if (!claim) {
    return 'pending';
  }
  if (claim.status === 'approved') {
    return 'complete';
  }
  if (claim.status === 'auto_initiated') {
    return 'active';
  }
  return 'pending';
}

export function getPolicyTitle(policy: BackendPolicy) {
  return `${getCoverageTierLabel(policy.coverage_tier)} Plan`;
}

export function getWorkerDisplayZone(worker: StoredWorker | null) {
  return worker?.zone ?? '';
}

export function getCurrentZone(worker: StoredWorker | null) {
  return worker ? getZoneById(worker.zone_id) ?? null : null;
}

export function getStoredWorkerShiftLabels(worker: StoredWorker | null) {
  if (!worker) {
    return [];
  }
  return worker.shift_ids
    .map((shiftId) => getShiftWindowById(shiftId)?.label)
    .filter((label): label is string => Boolean(label));
}

export function findEventForClaim(eventStore: BackendEvent | null, claim: BackendClaim | null) {
  if (!eventStore || !claim) {
    return null;
  }
  return eventStore.event_id === claim.event_id ? eventStore : null;
}
