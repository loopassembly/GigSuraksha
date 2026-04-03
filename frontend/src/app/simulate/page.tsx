'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { ApiError, simulateEvent } from '@/lib/api';
import {
  formatCurrencyValue,
  formatDateTime,
  formatNumber,
  getClaimStatusBadgeVariant,
  getDefaultSimulationZone,
  getEventInfo,
  getPrimaryShiftId,
  getSeverityBadgeVariant,
} from '@/lib/backend-helpers';
import { calculateShiftOverlap } from '@/lib/calculations';
import { DISRUPTION_TYPE_INFO, EVENT_TYPE_MAP, LIVE_ZONES, SEVERITY_CONFIG, SHIFT_WINDOWS } from '@/lib/constants';
import { getEvent, getPolicy, getWorker, saveEvent } from '@/lib/store';
import type { BackendClaim, DisruptionType, Severity, StoredWorker, StoredEvent } from '@/lib/types';
import {
  AlertTriangle,
  CheckCircle,
  CloudRain,
  Clock,
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
  return new Date().toISOString().slice(0, 10);
}

export default function SimulatePage() {
  const [worker, setWorker] = useState<StoredWorker | null>(null);
  const [type, setType] = useState<DisruptionType>('RAIN_EVENT');
  const [severity, setSeverity] = useState<Severity>('high');
  const [duration, setDuration] = useState(3);
  const [eventStartHour, setEventStartHour] = useState(18);
  const [eventDate, setEventDate] = useState(getTodayDate());
  const [zoneId, setZoneId] = useState('blr-kora');
  const [selectedShifts, setSelectedShifts] = useState<string[]>(['evening']);
  const [result, setResult] = useState<StoredEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedWorker = getWorker();
    const storedPolicy = getPolicy();
    const storedEvent = getEvent();
    const defaultZone = getDefaultSimulationZone(storedWorker);
    setWorker(storedWorker);
    setZoneId(defaultZone.id);
    setSelectedShifts(
      storedWorker?.shift_ids?.length
        ? storedWorker.shift_ids
        : storedPolicy?.shift_type
        ? [getShiftIdFromBackend(storedPolicy.shift_type)]
        : ['evening']
    );
    setResult(storedEvent);
  }, []);

  const zone = LIVE_ZONES.find((entry) => entry.id === zoneId) ?? getDefaultSimulationZone(worker);
  const info = DISRUPTION_TYPE_INFO[type];
  const sevConfig = SEVERITY_CONFIG[severity];
  const Icon = iconMap[info.icon] || CloudRain;
  const shifts = SHIFT_WINDOWS.filter((window) => selectedShifts.includes(window.id));
  const shiftOverlap = calculateShiftOverlap(eventStartHour, duration, shifts);
  const liveEventType = EVENT_TYPE_MAP[type];
  const isLiveSupported = Boolean(liveEventType);
  const startTime = `${eventDate}T${String(eventStartHour).padStart(2, '0')}:00:00`;
  const latestClaim = result?.claims?.[0] ?? null;

  async function handleTrigger() {
    if (!liveEventType) {
      setError('Extreme Heat is visible in the prototype UI, but it is not supported by the live simulation API yet.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await simulateEvent({
        event_type: liveEventType,
        city: zone.backendCity ?? zone.city,
        zone: zone.backendName ?? zone.name,
        severity,
        start_time: startTime,
        duration_hours: duration,
        source: 'frontend_demo',
        verified: true,
        metadata: {
          trigger: 'frontend_demo',
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
        setError(requestError.detail || requestError.message);
      } else {
        setError('Unable to trigger the live simulation right now. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setType('RAIN_EVENT');
    setSeverity('high');
    setDuration(3);
    setEventStartHour(18);
    setEventDate(getTodayDate());
    setZoneId(getDefaultSimulationZone(worker).id);
    setSelectedShifts(worker?.shift_ids?.length ? worker.shift_ids : ['evening']);
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 sm:py-10 w-full">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Disruption Trigger Simulation</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Trigger a live backend simulation to see event ingestion, claim auto-creation, and payout calculation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <Card padding="lg">
              <CardHeader title="Event Configuration" subtitle="Define the disruption parameters" />

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
                          setError(null);
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

              <div className="mb-5">
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">Zone</label>
                <select
                  value={zoneId}
                  onChange={(event) => setZoneId(event.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-[13px] text-text-primary bg-surface outline-none focus:border-primary"
                >
                  {LIVE_ZONES.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}, {entry.city} ({entry.riskLevel} risk)
                    </option>
                  ))}
                </select>
                <p className="text-[12px] text-text-muted mt-1">Only zones currently supported by the live backend are shown here.</p>
              </div>

              <div className="mb-5">
                <label className="block text-[13px] font-medium text-text-primary mb-2">Insured Shift Windows</label>
                <div className="space-y-2">
                  {SHIFT_WINDOWS.map((window) => (
                    <label key={window.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedShifts.includes(window.id)}
                        onChange={() => {
                          setSelectedShifts((previous) =>
                            previous.includes(window.id)
                              ? previous.filter((item) => item !== window.id)
                              : [...previous, window.id]
                          );
                        }}
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span className="text-[13px] text-text-secondary">{window.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[12px] text-text-muted mt-1">
                  These shifts are used for the on-screen overlap preview. Actual claim creation still depends on the active
                  policy stored in the backend.
                </p>
              </div>

              {!isLiveSupported && (
                <div className="mb-5 px-3 py-2.5 rounded-lg bg-warning-light border border-warning/20 text-[12px] text-text-secondary">
                  Extreme Heat stays visible in the prototype, but the live backend does not support this event type yet.
                </div>
              )}

              <Button onClick={handleTrigger} fullWidth disabled={isLoading || !isLiveSupported}>
                <Zap className="w-4 h-4" />
                {isLoading ? 'Triggering Live Simulation...' : 'Trigger Simulation'}
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
                    {zone.name}, {zone.city}
                  </p>
                </div>
                <Badge variant={getSeverityBadgeVariant(severity)} className="ml-auto">
                  {sevConfig.label}
                </Badge>
              </div>
              <div className="space-y-2 text-[13px]">
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

            {error && (
              <Card padding="md" className="border-danger/30 bg-danger-light">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-danger">{error}</p>
                </div>
              </Card>
            )}

            {result ? (
              <>
                <Card padding="md">
                  <CardHeader
                    title="Live Event Result"
                    action={<Badge variant="info">{result.event.event_id}</Badge>}
                  />
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Event Type</span>
                      <span className="font-medium text-text-primary">{getEventInfo(result.event.event_type).label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Zone</span>
                      <span className="font-medium text-text-primary">{result.event.zone}, {result.event.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Verified</span>
                      <span className="font-medium text-text-primary">{result.event.verified ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Created</span>
                      <span className="font-medium text-text-primary">{formatDateTime(result.event.created_at)}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="font-semibold text-text-primary">Claims Auto-Created</span>
                      <span className="text-[18px] font-bold text-primary">{result.claims_created}</span>
                    </div>
                  </div>
                </Card>

                <ClaimResultCard claim={latestClaim} />
              </>
            ) : (
              <div className="text-center py-10 text-text-muted">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-[13px]">Configure the event and click &quot;Trigger Simulation&quot; to see the live result</p>
              </div>
            )}

            {result && (
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

function ClaimResultCard({ claim }: { claim: BackendClaim | null }) {
  if (!claim) {
    return (
      <Card padding="md" className="ring-1 ring-warning">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <p className="text-[15px] font-semibold text-text-primary">No Claim Created</p>
        </div>
        <p className="text-[13px] text-text-secondary">
          The live event was recorded successfully, but no active policy matched the city, zone, validity window, and shift
          overlap rules required for automatic claim creation.
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
        <p className="text-primary font-semibold mt-1">= {formatCurrencyValue(claim.payout_estimate)}</p>
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
        <div className="border-t border-border pt-2 flex justify-between">
          <span className="font-semibold text-text-primary">Estimated Payout</span>
          <span className="text-[18px] font-bold text-success">{formatCurrencyValue(claim.payout_estimate)}</span>
        </div>
      </div>
    </Card>
  );
}

function getShiftIdFromBackend(shiftType: string) {
  if (shiftType === 'morning_rush') {
    return 'morning';
  }
  if (shiftType === 'afternoon') {
    return 'afternoon';
  }
  if (shiftType === 'late_night') {
    return 'night';
  }
  return getPrimaryShiftId(['evening']);
}
