'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { ApiError, createPolicy, generateQuote } from '@/lib/api';
import {
  buildPolicyPayload,
  buildQuotePayload,
  formatCurrencyValue,
  formatNumber,
  getDriverStrengths,
  getRiskBadgeVariant,
} from '@/lib/backend-helpers';
import { COVERAGE_TIERS, DISRUPTION_TYPE_INFO } from '@/lib/constants';
import { getQuote, getWorker, savePolicy, saveQuote } from '@/lib/store';
import type { BackendQuoteResponse, CoverageTierId, StoredWorker } from '@/lib/types';
import { ArrowRight, Info, Shield, TrendingUp, UserRound } from 'lucide-react';
import Link from 'next/link';

export default function QuotePage() {
  const router = useRouter();
  const [worker, setWorker] = useState<StoredWorker | null>(null);
  const [quote, setQuote] = useState<BackendQuoteResponse | null>(null);
  const [coverageTier, setCoverageTier] = useState<CoverageTierId>('standard');
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedWorker = getWorker();
    const storedQuote = getQuote();
    setWorker(storedWorker);
    if (storedQuote) {
      setQuote(storedQuote);
      setCoverageTier(storedQuote.coverage_summary.coverage_tier);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!worker) {
      setIsLoading(false);
      return;
    }
    const stableWorker = worker;

    let cancelled = false;

    async function loadQuote() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await generateQuote(buildQuotePayload(stableWorker, coverageTier));
        if (cancelled) {
          return;
        }
        setQuote(response);
        saveQuote(response);
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        if (requestError instanceof ApiError) {
          setError(requestError.detail || requestError.message);
        } else {
          setError('Unable to generate a live quote right now. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadQuote();

    return () => {
      cancelled = true;
    };
  }, [coverageTier, isReady, worker]);

  async function handleActivate() {
    if (!worker) {
      setError('Register a worker profile first to activate a policy.');
      return;
    }
    const stableWorker = worker;

    setIsActivating(true);
    setError(null);

    try {
      const policy = await createPolicy(buildPolicyPayload(stableWorker, coverageTier));
      savePolicy(policy);
      router.push('/policy');
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.detail || requestError.message);
      } else {
        setError('Unable to activate the policy right now. Please try again.');
      }
    } finally {
      setIsActivating(false);
    }
  }

  const selectedTier = COVERAGE_TIERS.find((tier) => tier.id === coverageTier) ?? COVERAGE_TIERS[1];
  const riskScore = quote?.risk_summary.risk_score ?? 0;
  const driverBars = getDriverStrengths(quote?.risk_summary.top_risk_drivers ?? [], riskScore);

  if (isReady && !worker) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-10 w-full">
          <Card padding="lg">
            <div className="flex items-start gap-3">
              <UserRound className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h1 className="text-xl font-bold text-text-primary">Register Before Getting a Quote</h1>
                <p className="text-[14px] text-text-secondary mt-1">
                  Your live quote depends on the worker profile stored during onboarding. Complete onboarding first,
                  then we will pull the real ML-backed quote from the deployed backend.
                </p>
                <div className="mt-4">
                  <Link href="/onboarding">
                    <Button>
                      Go to Onboarding
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
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
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-10 w-full">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Your Risk Assessment & Quote</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Based on your zone, insured shift, and weekly earnings, here is your live backend quote.
          </p>
        </div>

        {isLoading && !quote ? (
          <QuoteSkeleton />
        ) : quote ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card padding="lg">
                <CardHeader
                  title="Risk Profile"
                  subtitle={`${quote.worker_profile.zone}, ${worker?.display_city ?? quote.worker_profile.city}`}
                  action={<Badge variant={getRiskBadgeVariant(quote.risk_summary.risk_band)}>{quote.risk_summary.risk_band}</Badge>}
                />
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={
                          quote.risk_summary.risk_band === 'HIGH'
                            ? '#DC2626'
                            : quote.risk_summary.risk_band === 'MEDIUM'
                            ? '#D97706'
                            : '#059669'
                        }
                        strokeWidth="8"
                        strokeDasharray={`${Math.max(0, Math.min(100, riskScore)) * 2.64} 264`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[18px] font-bold text-text-primary">{riskScore}</span>
                    </div>
                  </div>
                  <div className="text-[13px] text-text-secondary leading-relaxed">
                    Expected disruption next week: {formatNumber(quote.risk_summary.expected_disrupted_hours)} hours.
                    The ML model currently rates this worker profile as {quote.risk_summary.risk_band.toLowerCase()} risk
                    for the insured shift.
                  </div>
                </div>
                <div className="space-y-2.5">
                  {driverBars.map((driver) => (
                    <div key={driver.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium text-text-secondary capitalize">{driver.label}</span>
                        <span className="text-[12px] font-semibold text-text-primary">{driver.score}/100</span>
                      </div>
                      <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${driver.score}%`, backgroundColor: '#2563EB' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-5 text-[12px]">
                  <div className="p-3 rounded-lg bg-background border border-border">
                    <p className="text-text-muted">Zone Risk Band</p>
                    <p className="font-semibold text-text-primary mt-1">{quote.risk_summary.zone_risk_band}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border border-border">
                    <p className="text-text-muted">Zone Baseline Score</p>
                    <p className="font-semibold text-text-primary mt-1">
                      {formatNumber(quote.risk_summary.zone_baseline_risk_score * 100)} / 100
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-6">
                <Card padding="lg">
                  <CardHeader title="Coverage Tier" subtitle="Switch tier to refresh the live quote" />
                  <div className="grid grid-cols-3 gap-2">
                    {COVERAGE_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() => setCoverageTier(tier.id)}
                        className={`p-3 rounded-lg border text-center transition-colors cursor-pointer ${
                          tier.id === coverageTier
                            ? 'border-primary bg-primary-light'
                            : 'border-border bg-surface hover:border-primary/40'
                        }`}
                      >
                        <p className="text-[13px] font-semibold text-text-primary">{tier.name}</p>
                        <p className="text-[11px] text-text-secondary mt-0.5">{tier.coveragePercent}% coverage</p>
                        <p className="text-[12px] font-bold text-primary mt-1">
                          Up to {formatCurrencyValue(tier.maxWeeklyPayout)}
                        </p>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card padding="lg">
                  <CardHeader title="Weekly Premium Breakdown" subtitle={`Model version: ${quote.model_version}`} />
                  <div className="space-y-2">
                    <PremiumLine label="Base Premium" value={quote.premium_breakdown.base_premium} />
                    <PremiumLine label="Zone Risk Loading" value={quote.premium_breakdown.zone_risk_loading} />
                    <PremiumLine label="Shift Exposure Loading" value={quote.premium_breakdown.shift_exposure_loading} />
                    <PremiumLine label="Coverage Factor" value={quote.premium_breakdown.coverage_factor} />
                    <PremiumLine label="ML Risk Loading" value={quote.premium_breakdown.ml_risk_loading} />
                    <PremiumLine label="Safe Zone Discount" value={quote.premium_breakdown.safe_zone_discount} />
                    <div className="border-t border-border pt-3 mt-3 flex justify-between items-baseline">
                      <span className="text-[14px] font-semibold text-text-primary">Weekly Premium</span>
                      <span className="text-[22px] font-bold text-primary">
                        {formatCurrencyValue(quote.premium_breakdown.final_weekly_premium)}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card padding="md" className="bg-primary-light border-primary/20">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-semibold text-primary">Coverage Summary</p>
                      <p className="text-[22px] font-bold text-text-primary mt-0.5">
                        {formatCurrencyValue(quote.coverage_summary.protected_weekly_income)}
                      </p>
                      <p className="text-[12px] text-text-secondary mt-1">
                        Protected hourly income: {formatCurrencyValue(quote.coverage_summary.protected_hourly_income)}/hr
                      </p>
                      <p className="text-[12px] text-text-secondary mt-1">
                        Basis: {formatNumber(quote.coverage_summary.protected_hours_basis)} insured hours,
                        max payout {formatCurrencyValue(quote.coverage_summary.max_weekly_payout)}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <Card padding="lg" className="mt-6">
              <CardHeader
                title="Eligible Disruption Triggers"
                subtitle={`${selectedTier.name} tier covers ${selectedTier.eligibleDisruptions.length} disruption types`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedTier.eligibleDisruptions.map((disruptionType) => {
                  const info = DISRUPTION_TYPE_INFO[disruptionType];
                  return (
                    <div
                      key={disruptionType}
                      className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-background"
                    >
                      <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-medium text-text-primary">{info.label}</p>
                        <p className="text-[11px] text-text-secondary mt-0.5">{info.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 px-3 py-2.5 rounded-lg bg-border-light flex items-start gap-2">
                <Info className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-text-secondary">
                  Final pricing remains deterministic. The ML model only contributes the weekly disruption risk loading
                  shown above.
                </p>
              </div>
            </Card>
          </>
        ) : (
          <Card padding="lg">
            <p className="text-[14px] text-text-secondary">
              We could not load your quote yet. Please try refreshing the page.
            </p>
          </Card>
        )}

        {error && (
          <div className="mt-6 px-3 py-2.5 rounded-lg bg-danger-light border border-danger/20 text-[13px] text-danger">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-between items-center gap-3">
          <Link href="/onboarding">
            <Button variant="ghost">Edit Worker Profile</Button>
          </Link>
          <Button onClick={handleActivate} disabled={!quote || isLoading || isActivating}>
            {isActivating ? 'Activating...' : 'Activate Weekly Protection'}
            {!isActivating && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </main>
    </>
  );
}

function PremiumLine({ label, value }: { label: string; value: number }) {
  const isDiscount = value < 0;

  return (
    <div className="flex justify-between items-center">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className={`text-[13px] font-medium ${isDiscount ? 'text-success' : 'text-text-primary'}`}>
        {isDiscount ? '-' : '+'}
        {formatCurrencyValue(Math.abs(value))}
      </span>
    </div>
  );
}

function QuoteSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
      <Card padding="lg">
        <div className="h-5 w-40 bg-border-light rounded" />
        <div className="h-4 w-52 bg-border-light rounded mt-2" />
        <div className="flex gap-4 mt-6">
          <div className="w-20 h-20 rounded-full bg-border-light" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-border-light rounded" />
            <div className="h-4 bg-border-light rounded w-5/6" />
            <div className="h-4 bg-border-light rounded w-2/3" />
          </div>
        </div>
        <div className="space-y-3 mt-6">
          <div className="h-4 bg-border-light rounded" />
          <div className="h-4 bg-border-light rounded" />
          <div className="h-4 bg-border-light rounded" />
        </div>
      </Card>
      <div className="space-y-6">
        <Card padding="lg">
          <div className="h-5 w-32 bg-border-light rounded" />
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="h-24 bg-border-light rounded-lg" />
            <div className="h-24 bg-border-light rounded-lg" />
            <div className="h-24 bg-border-light rounded-lg" />
          </div>
        </Card>
        <Card padding="lg">
          <div className="space-y-3">
            <div className="h-4 bg-border-light rounded" />
            <div className="h-4 bg-border-light rounded" />
            <div className="h-4 bg-border-light rounded" />
            <div className="h-6 bg-border-light rounded mt-4" />
          </div>
        </Card>
      </div>
    </div>
  );
}
