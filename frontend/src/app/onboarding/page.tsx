'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import { ApiError, registerWorker } from '@/lib/api';
import { CITIES, PLATFORMS, SHIFT_TYPE_MAP, SHIFT_WINDOWS, ZONES } from '@/lib/constants';
import { clearAll, saveWorker } from '@/lib/store';
import type { OnboardingData, City, StoredWorker } from '@/lib/types';
import { User, Briefcase, MapPin, IndianRupee, CheckCircle, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';

const STEPS = [
  { id: 0, label: 'Personal', icon: User },
  { id: 1, label: 'Work Profile', icon: Briefcase },
  { id: 2, label: 'Zone & Shifts', icon: MapPin },
  { id: 3, label: 'Earnings', icon: IndianRupee },
  { id: 4, label: 'Review', icon: CheckCircle },
];

const initial: OnboardingData = {
  name: '',
  mobile: '',
  city: '',
  platform: '',
  zoneId: '',
  shifts: [],
  weeklyEarnings: 0,
  weeklyActiveHours: 0,
  upiId: '',
};

function getPrimaryShiftId(shiftIds: string[]) {
  return shiftIds[0] ?? SHIFT_WINDOWS.find((window) => shiftIds.includes(window.id))?.id ?? 'evening';
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initial);
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const cityZones = ZONES.filter((zone) => zone.city === data.city);
  const selectedZone = ZONES.find((zone) => zone.id === data.zoneId);
  const primaryShiftId = getPrimaryShiftId(data.shifts);
  const isApiReadyZone = Boolean(selectedZone?.apiSupported);

  function update(partial: Partial<OnboardingData>) {
    setSubmitError(null);
    setData((prev) => ({ ...prev, ...partial }));
  }

  function toggleShift(shiftId: string) {
    setSubmitError(null);
    setData((prev) => ({
      ...prev,
      shifts: prev.shifts.includes(shiftId)
        ? prev.shifts.filter((shift) => shift !== shiftId)
        : [...prev.shifts, shiftId],
    }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return data.name.length >= 2 && data.mobile.length >= 10;
      case 1:
        return !!data.city && !!data.platform;
      case 2:
        return !!data.zoneId && data.shifts.length > 0;
      case 3:
        return data.weeklyEarnings > 0 && data.weeklyActiveHours > 0 && data.upiId.length > 0;
      default:
        return true;
    }
  }

  async function handleSubmit() {
    if (!selectedZone || !selectedZone.apiSupported) {
      setSubmitError('This zone is not yet connected to the live backend demo. Please choose a supported zone.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await registerWorker({
        name: data.name.trim(),
        phone: data.mobile.trim(),
        city: selectedZone.backendCity ?? data.city,
        platform: data.platform,
        zone: selectedZone.backendName ?? selectedZone.name,
        shift_type: SHIFT_TYPE_MAP[primaryShiftId],
        weekly_earnings: data.weeklyEarnings,
        weekly_active_hours: data.weeklyActiveHours,
        upi_id: data.upiId.trim(),
      });

      const storedWorker: StoredWorker = {
        worker_id: response.worker_id,
        name: response.name,
        phone: response.phone,
        display_city: data.city || response.city,
        backend_city: response.city,
        platform: response.platform,
        zone_id: selectedZone.id,
        zone: response.zone,
        shift_ids: data.shifts,
        shift_type: response.shift_type,
        weekly_earnings: response.weekly_earnings,
        weekly_active_hours: response.weekly_active_hours,
        upi_id: response.upi_id,
        created_at: response.created_at,
        updated_at: response.updated_at,
      };

      clearAll();
      saveWorker(storedWorker);
      router.push('/quote');
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.detail || error.message);
      } else {
        setSubmitError('Unable to register right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-6 sm:py-10 w-full">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((entry) => (
            <div key={entry.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => entry.id < step && setStep(entry.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                  entry.id === step
                    ? 'bg-primary text-white'
                    : entry.id < step
                    ? 'bg-primary-light text-primary cursor-pointer'
                    : 'bg-border-light text-text-muted'
                }`}
              >
                <entry.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{entry.label}</span>
              </button>
              {entry.id < STEPS.length - 1 && (
                <div className={`w-4 h-px ${entry.id < step ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <Card padding="lg">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[18px] font-semibold text-text-primary">Personal Information</h2>
                <p className="text-[13px] text-text-secondary mt-1">
                  We need basic details to set up your protection profile.
                </p>
              </div>
              <FieldGroup label="Full Name">
                <input
                  type="text"
                  value={data.name}
                  onChange={(event) => update({ name: event.target.value })}
                  placeholder="Enter your full name"
                  className="form-input"
                />
              </FieldGroup>
              <FieldGroup label="Mobile Number">
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={data.mobile}
                    onChange={(event) => update({ mobile: event.target.value })}
                    placeholder="+91 98765 43210"
                    className="form-input flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setOtpSent(true)}
                    disabled={data.mobile.length < 10}
                  >
                    {otpSent ? 'OTP Sent' : 'Send OTP'}
                  </Button>
                </div>
                {otpSent && (
                  <p className="text-[12px] text-success mt-1">
                    Demo: OTP verification simulated successfully
                  </p>
                )}
              </FieldGroup>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[18px] font-semibold text-text-primary">Work Profile</h2>
                <p className="text-[13px] text-text-secondary mt-1">
                  Tell us which city and platform you operate on.
                </p>
              </div>
              <FieldGroup label="City">
                <select
                  value={data.city}
                  onChange={(event) => update({ city: event.target.value as City, zoneId: '' })}
                  className="form-input"
                >
                  <option value="">Select city</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Platform">
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => update({ platform })}
                      className={`px-3 py-2.5 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                        data.platform === platform
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-border bg-surface text-text-secondary hover:border-primary/40'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </FieldGroup>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[18px] font-semibold text-text-primary">Zone & Shift Selection</h2>
                <p className="text-[13px] text-text-secondary mt-1">
                  Select your operating zone and the shift windows you typically work.
                </p>
              </div>
              <FieldGroup label="Operating Zone">
                {cityZones.length === 0 ? (
                  <p className="text-[13px] text-text-muted">Select a city first</p>
                ) : (
                  <div className="space-y-2">
                    {cityZones.map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => zone.apiSupported && update({ zoneId: zone.id })}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-[13px] transition-colors ${
                          zone.apiSupported ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                        } ${
                          data.zoneId === zone.id
                            ? 'border-primary bg-primary-light'
                            : 'border-border bg-surface hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-text-primary">{zone.name}</span>
                          <div className="flex items-center gap-2">
                            {!zone.apiSupported && <Badge variant="muted">API soon</Badge>}
                            <Badge
                              variant={
                                zone.riskLevel === 'high'
                                  ? 'danger'
                                  : zone.riskLevel === 'medium'
                                  ? 'warning'
                                  : 'success'
                              }
                            >
                              {zone.riskLevel} risk
                            </Badge>
                          </div>
                        </div>
                        <span className="text-[12px] text-text-muted">
                          {zone.darkStores.length} dark stores
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </FieldGroup>
              <FieldGroup label="Shift Windows">
                <div className="space-y-2">
                  {SHIFT_WINDOWS.map((window) => (
                    <button
                      key={window.id}
                      type="button"
                      onClick={() => toggleShift(window.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-[13px] transition-colors cursor-pointer ${
                        data.shifts.includes(window.id)
                          ? 'border-primary bg-primary-light text-primary font-medium'
                          : 'border-border bg-surface text-text-secondary hover:border-primary/40'
                      }`}
                    >
                      {window.label}
                    </button>
                  ))}
                </div>
                {data.shifts.length > 0 && (
                  <p className="text-[12px] text-text-muted mt-1">
                    Primary shift sent to the backend: {SHIFT_WINDOWS.find((window) => window.id === primaryShiftId)?.label}
                  </p>
                )}
              </FieldGroup>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[18px] font-semibold text-text-primary">Earnings & Payout</h2>
                <p className="text-[13px] text-text-secondary mt-1">
                  Enter your average weekly earnings and payout details.
                </p>
              </div>
              <FieldGroup label="Average Weekly Earnings (₹)">
                <input
                  type="number"
                  value={data.weeklyEarnings || ''}
                  onChange={(event) => update({ weeklyEarnings: Number(event.target.value) })}
                  placeholder="e.g. 6000"
                  className="form-input"
                />
                <p className="text-[12px] text-text-muted mt-1">
                  Your total earnings across all shifts in a typical week
                </p>
              </FieldGroup>
              <FieldGroup label="Weekly Active Hours">
                <input
                  type="number"
                  value={data.weeklyActiveHours || ''}
                  onChange={(event) => update({ weeklyActiveHours: Number(event.target.value) })}
                  placeholder="e.g. 40"
                  className="form-input"
                />
              </FieldGroup>
              <FieldGroup label="UPI ID">
                <input
                  type="text"
                  value={data.upiId}
                  onChange={(event) => update({ upiId: event.target.value })}
                  placeholder="yourname@upi"
                  className="form-input"
                />
                <p className="text-[12px] text-text-muted mt-1">
                  Payouts will be sent to this UPI handle
                </p>
              </FieldGroup>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[18px] font-semibold text-text-primary">Review Your Profile</h2>
                <p className="text-[13px] text-text-secondary mt-1">
                  Confirm your details before proceeding to your risk assessment and quote.
                </p>
              </div>
              <div className="bg-background border border-border rounded-lg divide-y divide-border">
                <ReviewRow label="Name" value={data.name} />
                <ReviewRow label="Mobile" value={data.mobile} />
                <ReviewRow label="City" value={data.city} />
                <ReviewRow label="Platform" value={data.platform} />
                <ReviewRow label="Zone" value={selectedZone?.name || '-'} />
                <ReviewRow
                  label="Shifts"
                  value={data.shifts
                    .map((shift) => SHIFT_WINDOWS.find((window) => window.id === shift)?.label || shift)
                    .join(', ')}
                />
                <ReviewRow label="Primary Shift (API)" value={SHIFT_WINDOWS.find((window) => window.id === primaryShiftId)?.label || '-'} />
                <ReviewRow label="Weekly Earnings" value={`₹${data.weeklyEarnings.toLocaleString('en-IN')}`} />
                <ReviewRow label="Weekly Hours" value={`${data.weeklyActiveHours} hrs`} />
                <ReviewRow label="UPI ID" value={data.upiId} />
              </div>

              {!isApiReadyZone && selectedZone && (
                <div className="px-3 py-2.5 rounded-lg bg-warning-light border border-warning/20 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-text-secondary">
                    This zone is visible in the prototype UI but is not yet wired to the live backend demo.
                    Choose a zone marked as supported to continue with live registration.
                  </p>
                </div>
              )}
            </div>
          )}

          {submitError && (
            <div className="mt-6 px-3 py-2.5 rounded-lg bg-danger-light border border-danger/20 text-[13px] text-danger">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting || !isApiReadyZone}>
                {isSubmitting ? 'Registering...' : 'View My Quote'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </Card>

        <style jsx>{`
          :global(.form-input) {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border: 1px solid #E2E8F0;
            border-radius: 0.5rem;
            font-size: 14px;
            color: #0F172A;
            background: #FFFFFF;
            transition: border-color 0.15s;
            outline: none;
          }
          :global(.form-input:focus) {
            border-color: #2563EB;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
          }
          :global(.form-input::placeholder) {
            color: #94A3B8;
          }
        `}</style>
      </main>
    </>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-text-primary mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex justify-between items-center">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className="text-[13px] font-medium text-text-primary text-right max-w-[60%]">{value}</span>
    </div>
  );
}
