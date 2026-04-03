'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { ApiError, getWorkerPolicies, simulateEvent } from '@/lib/api';
import {
  formatDateInputValue,
  formatCurrencyValue,
  formatDateTime,
  formatNumber,
  getClaimStatusBadgeVariant,
  getCoverageTierLabel,
  getEventInfo,
  getPayoutStatusBadgeVariant,
  getSeverityBadgeVariant,
  getShiftLabel,
} from '@/lib/backend-helpers';
import { calculateShiftOverlap } from '@/lib/calculations';
import { DISRUPTION_TYPE_INFO, EVENT_TYPE_MAP, SEVERITY_CONFIG, SHIFT_WINDOWS } from '@/lib/constants';
import { getEvent, getPolicy, getWorker, saveEvent, savePolicy } from '@/lib/store';
import type { BackendClaim, BackendPolicy, DisruptionType, Severity, StoredEvent, StoredWorker } from '@/lib/types';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  CloudRain,
  Clock,
  MapPin,
  Shield,
  ShieldOff,
  Store,
  Thermometer,
  Waves,
  WifiOff,
  Wind,
  Zap,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CloudRain,
  Waves,
  Thermometer,
  Wind,
  ShieldOff,
  Store,
  WifiOff,
};

const DISRUPTION_TYPES = Object.keys(DISRUPTION_TYPE_INFO) as DisruptionType[];
const SEVERITIES: Severity[] = ['low', 'moderate', 'high', 'severe'];

function getTodayDate() {
  return formatDateInputValue(new Date());
}

function getShiftWindowFromBackend(shiftType?: string) {
  if (shiftType === 'morning_rush') {
    return SHIFT_WINDOWS.find((window) => window.id === 'morning') ?? null;
  }
  if (shiftType === 'afternoon') {
    return SHIFT_WINDOWS.find((window) => window.id === 'afternoon') ?? null;
  }
  if (shiftType === 'late_night') {
    return SHIFT_WINDOWS.find((window) => window.id === 'night') ?? null;
  }
  if (shiftType === 'evening_rush') {
    return SHIFT_WINDOWS.find((window) => window.id === 'evening') ?? null;
  }
  return null;
}

export default function SimulatePage() {
  const [worker, setWorker] = useState<StoredWorker | null>(null);
  const [policy, setPolicy] = useState<BackendPolicy | null>(null);
  const [type, setType] = useState<DisruptionType>('RAIN_EVENT');
  const [severity, setSeverity] = useState<Severity>('high');
  const [duration, setDuration] = useState(3);
  const [eventStartHour, setEventStartHour] = useState(18);
  const [eventDate, setEventDate] = useState(getTodayDate());
  const [result, setResult] = useState<StoredEvent | null>(null);
  const [isContextLoading, setIsContextLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  useEffect(() => {
    const storedWorker = getWorker();
    const storedPolicy = getPolicy();
    const storedEvent = getEvent();

    setWorker(storedWorker);
    setPolicy(storedPolicy);
    setResult(storedEvent);

    let cancelled = false;

    async function loadPolicyContext() {
      if (!storedWorker?.worker_id) {
        setIsContextLoading(false);
        return;
      }

      setIsContextLoading(true);
      setContextError(null);

      try {
        const policies = await getWorkerPolicies(storedWorker.worker_id);
        if (cancelled) {
          return;
        }

        const activePolicy =
          policies.find((item) => item.status === 'active') ??
          (storedPolicy?.status === 'active' ? storedPolicy : null);

        setPolicy(activePolicy);
        if (activePolicy) {
          savePolicy(activePolicy);
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        if (!storedPolicy || storedPolicy.status !== 'active') {
          if (requestError instanceof ApiError) {
            setContextError(requestError.detail || requestError.message);
          } else {
            setContextError('Unable to load the active policy context right now.');
          }
        }
      } finally {
        if (!cancelled) {
          setIsContextLoading(false);
        }
      }
    }

    void loadPolicyContext();

    return () => {
      cancelled = true;
    };
  }, []);

  const info = DISRUPTION_TYPE_INFO[type];
  const sevConfig = SEVERITY_CONFIG[severity];
  const Icon = iconMap[info.icon] || CloudRain;
  const liveEventType = EVENT_TYPE_MAP[type];
  const startTime = `${eventDate}T${String(eventStartHour).padStart(2, '0')}:00:00`;
  const insuredShiftWindow = getShiftWindowFromBackend(policy?.shift_type ?? worker?.shift_type);
  const shiftOverlap = insuredShiftWindow
    ? calculateShiftOverlap(eventStartHour, duration, [insuredShiftWindow])
    : 0;
  const activePolicy = policy?.status === 'active' ? policy : null;

  const activeResult =
    result && activePolicy && result.event.city === activePolicy.city && result.event.zone === activePolicy.zone
      ? result
      : null;

  const latestClaim = activeResult?.claims?.[0] ?? null;

  async function handleTrigger() {
    if (!activePolicy) {
      setSimulationError('Activate a policy before running a worker-bound disruption simulation.');
      return;
    }

    if (!liveEventType) {
      setSimulationError('This disruption type is not supported by the live simulation API.');
      return;
    }

    setIsSubmitting(true);
    setSimulationError(null);

    try {
      const response = await simulateEvent({
        event_type: liveEventType,
        city: activePolicy.city,
        zone: activePolicy.zone,
        severity,
        start_time: startTime,
        duration_hours: duration,
        source: 'frontend_demo',
        verified: true,
        metadata: {
          trigger: 'frontend_demo',
          worker_id: activePolicy.worker_id,
          policy_id: activePolicy.policy_id,
          reported_city: activePolicy.city,
          reported_zone: activePolicy.zone,
          activity_status: 'policy_bound_context',
          location_confidence_score: 0.96,
          session_inconsistency_score: 0.08,
        },
      });

      const storedResult: StoredEvent = {
        event: response.event,
        claims_created: response.claims_created,
        claims: response.claims,
      };

      setResult(storedResult);
      saveEvent(storedResult);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setSimulationError(requestError.detail || requestError.message);
      } else {
        setSimulationError('Unable to trigger the live simulation right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setResult(null);
    setSimulationError(null);
    setType('RAIN_EVENT');
    setSeverity('high');
    setDuration(3);
    setEventStartHour(18);
    setEventDate(getTodayDate());
  }

  if (isContextLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-4 py-6 sm:py-10 w-full">
          <SimulationSkeleton />
        </main>
      </>
    );
  }

  if (!activePolicy) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-10 w-full">
          <Card padding="lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-text-primary">No Active Policy Found</h1>
                <p className="text-[14px] text-text-secondary mt-1">
                  Worker-side disruption simulation is tied to the active insured zone and shift stored in the backend.
                  Create a worker profile and activate weekly protection before simulating a disruption.
                </p>
                {contextError && (
                  <p className="text-[13px] text-danger mt-3">{contextError}</p>
                )}
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Link href={worker ? '/quote' : '/onboarding'}>
                    <Button>
                      {worker ? 'Get a Quote' : 'Start Onboarding'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  {worker && (
                    <Link href="/policy">
                      <Button variant="outline">View Policy Page</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 sm:py-10 w-full">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Disruption Trigger Simulation</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Simulate what happens if a verified disruption affects this worker’s active insured zone and shift.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <Card padding="lg">
              <CardHeader title="Event Configuration" subtitle="Adjust the disruption event only. Policy context comes from the active backend policy." />

              <div className="mb-5 p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[14px] font-semibold text-text-primary">Active Policy Context</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">
                      Simulations are evaluated against the worker&apos;s active insured shift stored in the backend.
                    </p>
                  </div>
                  <Badge variant="success">Policy Active</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                  <ContextRow label="City" value={activePolicy.city} />
                  <ContextRow label="Zone" value={activePolicy.zone} />
                  <ContextRow label="Insured Shift" value={getShiftLabel(activePolicy.shift_type)} />
                  <ContextRow label="Coverage Tier" value={getCoverageTierLabel(activePolicy.coverage_tier)} />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[13px] font-medium text-text-primary mb-2">Disruption Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DISRUPTION_TYPES.map((disruptionType) => {
                    const disruptionInfo = DISRUPTION_TYPE_INFO[disruptionType];
                    const DisruptionIcon = iconMap[disruptionInfo.icon] || CloudRain;
                    const disabled = !EVENT_TYPE_MAP[disruptionType];
                    return (
                      <button
                        key={disruptionType}
                        onClick={() => {
                          setType(disruptionType);
                          setSimulationError(null);
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left text-[13px] transition-colors ${
                          type === disruptionType
                            ? 'border-primary bg-primary-light'
                            : 'border-border bg-surface hover:border-primary/40'
                        } ${disabled ? 'opacity-70' : 'cursor-pointer'}`}
                      >
                        <DisruptionIcon
                          className={`w-4 h-4 flex-shrink-0 ${type === disruptionType ? 'text-primary' : 'text-text-muted'}`}
                        />
                        <div className="min-w-0">
                          <span className={`font-medium ${type === disruptionType ? 'text-primary' : 'text-text-secondary'}`}>
                            {disruptionInfo.label}
                          </span>
                          {disabled && <p className="text-[11px] text-warning mt-0.5">UI only for now</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[13px] font-medium text-text-primary mb-2">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITIES.map((value) => (
                    <button
                      key={value}
                      onClick={() => setSeverity(value)}
                      className={`px-3 py-2 rounded-lg border text-[13px] font-medium text-center transition-colors cursor-pointer ${
                        severity === value
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-border bg-surface text-text-secondary hover:border-primary/40'
                      }`}
                    >
                      {SEVERITY_CONFIG[value].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">Simulation Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-[13px] text-text-primary bg-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">Duration (hours)</label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={0.5}
                    value={duration}
                    onChange={(event) => setDuration(Number(event.target.value))}
                    className="w-full accent-primary"
                  />
                  <p className="text-[13px] text-text-secondary mt-1">{duration} hours</p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">Event Start Hour</label>
                  <select
                    value={eventStartHour}
                    onChange={(event) => setEventStartHour(Number(event.target.value))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-[13px] text-text-primary bg-surface outline-none focus:border-primary"
                  >
                    {Array.from({ length: 24 }, (_, hour) => (
                      <option key={hour} value={hour}>
                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button onClick={handleTrigger} fullWidth disabled={isSubmitting}>
                <Zap className="w-4 h-4" />
                {isSubmitting ? 'Triggering Live Simulation...' : 'Trigger Simulation'}
              </Button>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <Card padding="md">
              <CardHeader title="Event Summary" />
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-background border border-border">
                <Icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">{info.label}</p>
                  <p className="text-[12px] text-text-secondary">
                    {activePolicy.zone}, {activePolicy.city}
                  </p>
                </div>
                <Badge variant={getSeverityBadgeVariant(severity)} className="ml-auto">
                  {sevConfig.label}
                </Badge>
              </div>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Insured Shift</span>
                  <span className="font-medium text-text-primary">{getShiftLabel(activePolicy.shift_type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Coverage Tier</span>
                  <span className="font-medium text-text-primary">{getCoverageTierLabel(activePolicy.coverage_tier)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Duration</span>
                  <span className="font-medium text-text-primary">{duration} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Severity Multiplier</span>
                  <span className="font-medium text-text-primary">{sevConfig.multiplier}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Preview Shift Overlap</span>
                  <span className="font-medium text-text-primary">{formatNumber(shiftOverlap, 1)} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Start Time</span>
                  <span className="font-medium text-text-primary text-right">{startTime}</span>
                </div>
              </div>
            </Card>

            {simulationError && (
              <Card padding="md" className="border-danger/30 bg-danger-light">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-danger">{simulationError}</p>
                </div>
              </Card>
            )}

            {activeResult ? (
              <>
                <Card padding="md">
                  <CardHeader title="Live Event Result" action={<Badge variant="info">{activeResult.event.event_id}</Badge>} />
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Event Type</span>
                      <span className="font-medium text-text-primary">{getEventInfo(activeResult.event.event_type).label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Zone</span>
                      <span className="font-medium text-text-primary">{activeResult.event.zone}, {activeResult.event.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Verified</span>
                      <span className="font-medium text-text-primary">{activeResult.event.verified ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Created</span>
                      <span className="font-medium text-text-primary">{formatDateTime(activeResult.event.created_at)}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="font-semibold text-text-primary">Claims Auto-Created</span>
                      <span className="text-[18px] font-bold text-primary">{activeResult.claims_created}</span>
                    </div>
                  </div>
                </Card>

                <ClaimResultCard claim={latestClaim} />
              </>
            ) : (
              <div className="text-center py-10 text-text-muted">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-[13px]">
                  Configure the disruption event and click &quot;Trigger Simulation&quot; to see what happens for this active policy.
                </p>
              </div>
            )}

            {activeResult && (
              <Button variant="outline" fullWidth onClick={handleReset}>
                Reset Simulation
              </Button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[11px] uppercase tracking-wide text-text-muted">{label}</p>
        <p className="text-[13px] font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function ClaimResultCard({ claim }: { claim: BackendClaim | null }) {
  if (!claim) {
    return (
      <Card padding="md" className="ring-1 ring-warning">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <p className="text-[15px] font-semibold text-text-primary">No Claim Created</p>
        </div>
        <p className="text-[13px] text-text-secondary">
          The live event was recorded successfully, but no claim was created for the active policy. This usually means the
          event did not overlap the insured shift window or fell outside the policy validity rules.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="md" className="ring-1 ring-success">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-success" />
        <p className="text-[15px] font-semibold text-text-primary">Claim Auto-Created</p>
        <Badge variant={getClaimStatusBadgeVariant(claim.status)} className="ml-auto">
          {claim.status}
        </Badge>
      </div>

      <div className="bg-background border border-border rounded-lg p-3 mb-4 font-mono text-[12px] text-text-secondary">
        <p className="text-text-muted text-[10px] mb-1">{'// Backend payout calculation'}</p>
        <p>
          min({formatCurrencyValue(claim.protected_hourly_income)} x {formatNumber(claim.affected_hours, 1)}h x{' '}
          {claim.severity_multiplier}, policy cap)
        </p>
        <p className="text-primary font-semibold mt-1">= {formatCurrencyValue(claim.payout_amount)}</p>
      </div>

      <div className="space-y-2 text-[13px]">
        <div className="flex justify-between">
          <span className="text-text-secondary">Claim ID</span>
          <span className="font-medium text-text-primary">{claim.claim_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Affected Hours</span>
          <span className="font-medium text-text-primary">{formatNumber(claim.affected_hours, 1)}h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Protected Hourly Income</span>
          <span className="font-medium text-text-primary">{formatCurrencyValue(claim.protected_hourly_income)}/hr</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Severity Multiplier</span>
          <span className="font-medium text-text-primary">{claim.severity_multiplier}x</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Payout Status</span>
          <Badge variant={getPayoutStatusBadgeVariant(claim.payout_status)}>{claim.payout_status}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Anomaly Band</span>
          <Badge variant={claim.anomaly_band === 'HIGH' ? 'danger' : claim.anomaly_band === 'MEDIUM' ? 'warning' : 'success'}>
            {claim.anomaly_band}
          </Badge>
        </div>
        <div className="border-t border-border pt-2 flex justify-between">
          <span className="font-semibold text-text-primary">Payout Amount</span>
          <span className="text-[18px] font-bold text-success">{formatCurrencyValue(claim.payout_amount)}</span>
        </div>
      </div>
      {(claim.payout_reference || claim.anomaly_reasons.length > 0) && (
        <div className="mt-4 space-y-2 text-[12px]">
          {claim.payout_reference && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Payout Reference</span>
              <span className="font-medium text-text-primary">{claim.payout_reference}</span>
            </div>
          )}
          {claim.anomaly_reasons.length > 0 && (
            <div>
              <p className="text-text-secondary mb-1">Integrity Notes</p>
              <div className="space-y-1">
                {claim.anomaly_reasons.map((reason) => (
                  <p key={reason} className="text-text-primary capitalize">
                    - {reason}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function SimulationSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-pulse">
      <div className="lg:col-span-3">
        <Card padding="lg">
          <div className="h-5 w-44 bg-border-light rounded" />
          <div className="h-16 bg-border-light rounded-lg mt-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5">
            <div className="h-16 bg-border-light rounded-lg" />
            <div className="h-16 bg-border-light rounded-lg" />
            <div className="h-16 bg-border-light rounded-lg" />
            <div className="h-16 bg-border-light rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div className="h-16 bg-border-light rounded-lg" />
            <div className="h-16 bg-border-light rounded-lg" />
            <div className="h-16 bg-border-light rounded-lg" />
          </div>
          <div className="h-10 bg-border-light rounded-lg mt-5" />
        </Card>
      </div>
      <div className="lg:col-span-2 space-y-5">
        <Card padding="md">
          <div className="h-40 bg-border-light rounded-lg" />
        </Card>
        <Card padding="md">
          <div className="h-48 bg-border-light rounded-lg" />
        </Card>
      </div>
    </div>
  );
}
