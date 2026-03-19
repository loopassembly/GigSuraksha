'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { ZONES, DISRUPTION_TYPE_INFO, SEVERITY_CONFIG, SHIFT_WINDOWS } from '@/lib/constants';
import { calculatePayout, calculateShiftOverlap, formatCurrency } from '@/lib/calculations';
import type { DisruptionType, Severity } from '@/lib/types';
import {
  CloudRain,
  Waves,
  Thermometer,
  Wind,
  ShieldOff,
  Store,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Zap,
  Clock,
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

export default function SimulatePage() {
  const [type, setType] = useState<DisruptionType>('RAIN_EVENT');
  const [severity, setSeverity] = useState<Severity>('high');
  const [duration, setDuration] = useState(3);
  const [eventStartHour, setEventStartHour] = useState(18);
  const [zoneId, setZoneId] = useState('blr-kora');
  const [selectedShifts, setSelectedShifts] = useState(['morning', 'evening']);
  const [triggered, setTriggered] = useState(false);

  const zone = ZONES.find((z) => z.id === zoneId);
  const info = DISRUPTION_TYPE_INFO[type];
  const sevConfig = SEVERITY_CONFIG[severity];
  const Icon = iconMap[info.icon] || CloudRain;

  const shifts = SHIFT_WINDOWS.filter((sw) => selectedShifts.includes(sw.id));
  const shiftOverlap = calculateShiftOverlap(eventStartHour, duration, shifts);
  const protectedHourlyIncome = 150;
  const weeklyCap = 3500;
  const payout = calculatePayout(protectedHourlyIncome, shiftOverlap, severity, weeklyCap);

  function handleTrigger() {
    setTriggered(true);
  }

  function handleReset() {
    setTriggered(false);
    setType('RAIN_EVENT');
    setSeverity('high');
    setDuration(3);
    setEventStartHour(18);
    setZoneId('blr-kora');
    setSelectedShifts(['morning', 'evening']);
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 sm:py-10 w-full">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Disruption Trigger Simulation</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Simulate a disruption event to see how the parametric engine calculates eligibility and payout.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-3 space-y-5">
            <Card padding="lg">
              <CardHeader title="Event Configuration" subtitle="Define the disruption parameters" />

              {/* Disruption Type */}
              <div className="mb-5">
                <label className="block text-[13px] font-medium text-text-primary mb-2">Disruption Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DISRUPTION_TYPES.map((dt) => {
                    const dtInfo = DISRUPTION_TYPE_INFO[dt];
                    const DtIcon = iconMap[dtInfo.icon] || CloudRain;
                    return (
                      <button
                        key={dt}
                        onClick={() => { setType(dt); setTriggered(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left text-[13px] transition-colors cursor-pointer ${
                          type === dt
                            ? 'border-primary bg-primary-light'
                            : 'border-border bg-surface hover:border-primary/40'
                        }`}
                      >
                        <DtIcon className={`w-4 h-4 flex-shrink-0 ${type === dt ? 'text-primary' : 'text-text-muted'}`} />
                        <span className={`font-medium ${type === dt ? 'text-primary' : 'text-text-secondary'}`}>
                          {dtInfo.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity */}
              <div className="mb-5">
                <label className="block text-[13px] font-medium text-text-primary mb-2">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSeverity(s); setTriggered(false); }}
                      className={`px-3 py-2 rounded-lg border text-[13px] font-medium text-center transition-colors cursor-pointer ${
                        severity === s
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-border bg-surface text-text-secondary hover:border-primary/40'
                      }`}
                    >
                      {SEVERITY_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration & Start */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">Duration (hours)</label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={0.5}
                    value={duration}
                    onChange={(e) => { setDuration(Number(e.target.value)); setTriggered(false); }}
                    className="w-full accent-primary"
                  />
                  <p className="text-[13px] text-text-secondary mt-1">{duration} hours</p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">Event Start Hour</label>
                  <select
                    value={eventStartHour}
                    onChange={(e) => { setEventStartHour(Number(e.target.value)); setTriggered(false); }}
                    className="w-full px-3 py-2 border border-border rounded-lg text-[13px] text-text-primary bg-surface outline-none focus:border-primary"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Zone */}
              <div className="mb-5">
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">Zone</label>
                <select
                  value={zoneId}
                  onChange={(e) => { setZoneId(e.target.value); setTriggered(false); }}
                  className="w-full px-3 py-2 border border-border rounded-lg text-[13px] text-text-primary bg-surface outline-none focus:border-primary"
                >
                  {ZONES.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}, {z.city} ({z.riskLevel} risk)
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift Selection */}
              <div className="mb-5">
                <label className="block text-[13px] font-medium text-text-primary mb-2">Insured Shift Windows</label>
                <div className="space-y-2">
                  {SHIFT_WINDOWS.map((sw) => (
                    <label key={sw.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedShifts.includes(sw.id)}
                        onChange={() => {
                          setSelectedShifts((prev) =>
                            prev.includes(sw.id) ? prev.filter((s) => s !== sw.id) : [...prev, sw.id]
                          );
                          setTriggered(false);
                        }}
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span className="text-[13px] text-text-secondary">{sw.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleTrigger} fullWidth>
                <Zap className="w-4 h-4" />
                Trigger Simulation
              </Button>
            </Card>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Event Summary */}
            <Card padding="md">
              <CardHeader title="Event Summary" />
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-background border border-border">
                <Icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">{info.label}</p>
                  <p className="text-[12px] text-text-secondary">{zone?.name}, {zone?.city}</p>
                </div>
                <Badge variant={severity === 'severe' ? 'danger' : severity === 'high' ? 'warning' : 'muted'} className="ml-auto">
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
                  <span className="text-text-secondary">Shift Overlap</span>
                  <span className="font-medium text-text-primary">{shiftOverlap} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Data Source</span>
                  <span className="font-medium text-text-primary text-right max-w-[60%]">{info.description.split('.')[0]}</span>
                </div>
              </div>
            </Card>

            {/* Payout Result */}
            {triggered && (
              <Card padding="md" className={shiftOverlap > 0 ? 'ring-1 ring-success' : 'ring-1 ring-danger'}>
                <div className="flex items-center gap-2 mb-4">
                  {shiftOverlap > 0 ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-danger" />
                  )}
                  <p className="text-[15px] font-semibold text-text-primary">
                    {shiftOverlap > 0 ? 'Claim Eligible' : 'Not Eligible'}
                  </p>
                </div>

                {shiftOverlap > 0 ? (
                  <>
                    <div className="bg-background border border-border rounded-lg p-3 mb-4 font-mono text-[12px] text-text-secondary">
                      <p className="text-text-muted text-[10px] mb-1">// Payout calculation</p>
                      <p>min(₹{protectedHourlyIncome} × {shiftOverlap}h × {sevConfig.multiplier}, ₹{weeklyCap})</p>
                      <p className="text-primary font-semibold mt-1">= {formatCurrency(payout)}</p>
                    </div>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Protected Hourly Income</span>
                        <span className="font-medium">{formatCurrency(protectedHourlyIncome)}/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Affected Hours</span>
                        <span className="font-medium">{shiftOverlap}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Severity Multiplier</span>
                        <span className="font-medium">{sevConfig.multiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Weekly Cap Remaining</span>
                        <span className="font-medium">{formatCurrency(weeklyCap)}</span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between">
                        <span className="font-semibold text-text-primary">Estimated Payout</span>
                        <span className="text-[18px] font-bold text-success">{formatCurrency(payout)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-text-secondary">
                    The disruption event does not overlap with any insured shift window.
                    Adjust the event start time or shift selection and try again.
                  </p>
                )}
              </Card>
            )}

            {!triggered && (
              <div className="text-center py-10 text-text-muted">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-[13px]">Configure the event and click &quot;Trigger Simulation&quot; to see results</p>
              </div>
            )}

            {triggered && (
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
