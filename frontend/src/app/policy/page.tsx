'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { ApiError, getPolicy, getWorkerPolicies } from '@/lib/api';
import {
  formatCurrencyValue,
  formatDateRange,
  getCoverageTierLabel,
  getPolicyStatusBadgeVariant,
  getPolicyTitle,
  getShiftLabel,
} from '@/lib/backend-helpers';
import { COVERAGE_TIERS, DISRUPTION_TYPE_INFO } from '@/lib/constants';
import { getPolicy as getStoredPolicy, getWorker, savePolicy } from '@/lib/store';
import type { BackendPolicy, StoredWorker } from '@/lib/types';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Shield,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

const exclusions = [
  'Low order demand or reduced incentives',
  'Rider oversupply in zone',
  'Self-reported disruptions without data source',
  'Planned maintenance or scheduled outages',
  'Events outside insured shift windows',
  'Disruptions in non-registered zones',
];

export default function PolicyPage() {
  const [worker, setWorker] = useState<StoredWorker | null>(null);
  const [policy, setPolicy] = useState<BackendPolicy | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedWorker = getWorker();
    const storedPolicy = getStoredPolicy();
    setWorker(storedWorker);
    setPolicy(storedPolicy);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const workerId = worker?.worker_id;
    const stableWorkerId = workerId;
    let cancelled = false;

    async function loadPolicy() {
      setIsLoading(true);
      setError(null);

      try {
        const cachedPolicy = getStoredPolicy();
        if (cachedPolicy?.policy_id) {
          const freshPolicy = await getPolicy(cachedPolicy.policy_id);
          if (cancelled) {
            return;
          }
          setPolicy(freshPolicy);
          savePolicy(freshPolicy);
          return;
        }

        if (stableWorkerId) {
          const workerPolicies = await getWorkerPolicies(stableWorkerId);
          if (cancelled) {
            return;
          }
          const latestPolicy =
            workerPolicies.find((item) => item.status === 'active') ?? workerPolicies[0] ?? null;
          setPolicy(latestPolicy);
          if (latestPolicy) {
            savePolicy(latestPolicy);
          }
        } else if (!cachedPolicy) {
          setPolicy(null);
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        if (requestError instanceof ApiError) {
          setError(requestError.detail || requestError.message);
        } else {
          setError('Unable to load the latest policy right now.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPolicy();

    return () => {
      cancelled = true;
    };
  }, [isReady, worker]);

  const tier = policy ? COVERAGE_TIERS.find((item) => item.id === policy.coverage_tier) : null;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-10 w-full">
        {isLoading ? (
          <PolicySkeleton />
        ) : !policy ? (
          <Card padding="lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h1 className="text-xl font-bold text-text-primary">No Active Policy Yet</h1>
                <p className="text-[14px] text-text-secondary mt-1">
                  Create a live quote first, then activate weekly protection to see the policy snapshot here.
                </p>
                {error && <p className="text-[13px] text-danger mt-3">{error}</p>}
                <div className="mt-4">
                  <Link href="/quote">
                    <Button>
                      Get a Quote
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Policy Summary</h1>
                <p className="text-[14px] text-text-secondary mt-1">
                  Active protection for {formatDateRange(policy.valid_from, policy.valid_to)}
                </p>
              </div>
              <Badge variant={getPolicyStatusBadgeVariant(policy.status)}>{policy.status}</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card padding="lg">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-text-primary">{policy.policy_id}</p>
                      <p className="text-[13px] text-text-secondary">
                        {worker?.name || 'Registered worker'} - {getPolicyTitle(policy)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <PolicyDetail icon={Calendar} label="Validity" value={formatDateRange(policy.valid_from, policy.valid_to)} />
                    <PolicyDetail icon={MapPin} label="Zone" value={`${policy.zone}, ${policy.city}`} />
                    <PolicyDetail icon={Clock} label="Insured Shift" value={getShiftLabel(policy.shift_type)} />
                    <PolicyDetail icon={Shield} label="Max Payout" value={formatCurrencyValue(policy.max_weekly_payout)} />
                  </div>
                </Card>

                <Card padding="lg">
                  <CardHeader title="Financial Summary" subtitle={`Model version: ${policy.model_version}`} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-primary-light">
                      <p className="text-[11px] font-medium text-primary uppercase tracking-wide">Weekly Premium</p>
                      <p className="text-[20px] font-bold text-text-primary mt-1">
                        {formatCurrencyValue(policy.weekly_premium)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-success-light">
                      <p className="text-[11px] font-medium text-success uppercase tracking-wide">Protected Income</p>
                      <p className="text-[20px] font-bold text-text-primary mt-1">
                        {formatCurrencyValue(policy.coverage_summary.protected_weekly_income)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-border-light">
                      <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">Hourly Rate</p>
                      <p className="text-[20px] font-bold text-text-primary mt-1">
                        {formatCurrencyValue(policy.coverage_summary.protected_hourly_income)}/hr
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-[12px]">
                    <div className="p-3 rounded-lg border border-border bg-background">
                      <p className="text-text-muted">Coverage Tier</p>
                      <p className="font-semibold text-text-primary mt-1">{getCoverageTierLabel(policy.coverage_tier)}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-background">
                      <p className="text-text-muted">Coverage Percent</p>
                      <p className="font-semibold text-text-primary mt-1">{policy.coverage_percent}%</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-background">
                      <p className="text-text-muted">Protected Hours Basis</p>
                      <p className="font-semibold text-text-primary mt-1">{policy.coverage_summary.protected_hours_basis} hrs</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-background">
                      <p className="text-text-muted">Insured Hours Per Week</p>
                      <p className="font-semibold text-text-primary mt-1">
                        {policy.coverage_summary.insured_shift_hours_per_week} hrs
                      </p>
                    </div>
                  </div>
                </Card>

                {tier && (
                  <Card padding="lg">
                    <CardHeader
                      title="Covered Disruptions"
                      subtitle={`${tier.eligibleDisruptions.length} event types covered under ${tier.name}`}
                    />
                    <div className="space-y-2">
                      {tier.eligibleDisruptions.map((disruptionType) => {
                        const info = DISRUPTION_TYPE_INFO[disruptionType];
                        return (
                          <div
                            key={disruptionType}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border"
                          >
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-text-primary">{info.label}</p>
                            </div>
                            <Badge variant="muted">{info.category}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card padding="md">
                  <CardHeader title="Quick Actions" />
                  <div className="space-y-2">
                    <Link href="/simulate" className="block">
                      <Button variant="outline" fullWidth>
                        Simulate Disruption
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/claim" className="block">
                      <Button variant="outline" fullWidth>
                        View Claim History
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/dashboard" className="block">
                      <Button variant="outline" fullWidth>
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>

                <Card padding="md">
                  <CardHeader title="Exclusions" subtitle="Not covered under this plan" />
                  <div className="space-y-2">
                    {exclusions.map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <XCircle className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
                        <p className="text-[12px] text-text-secondary">{item}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card padding="md" className="bg-warning-light border-warning/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-semibold text-warning">Important</p>
                      <p className="text-[12px] text-text-secondary mt-0.5">
                        Risk pricing is ML-assisted, but claim approval and payout are still governed by the backend’s
                        deterministic rules engine.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function PolicyDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-[13px] font-medium text-text-primary">{value}</p>
    </div>
  );
}

function PolicySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-52 bg-border-light rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <div className="h-5 w-40 bg-border-light rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="h-16 bg-border-light rounded-lg" />
              <div className="h-16 bg-border-light rounded-lg" />
              <div className="h-16 bg-border-light rounded-lg" />
              <div className="h-16 bg-border-light rounded-lg" />
            </div>
          </Card>
          <Card padding="lg">
            <div className="h-5 w-44 bg-border-light rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="h-20 bg-border-light rounded-lg" />
              <div className="h-20 bg-border-light rounded-lg" />
              <div className="h-20 bg-border-light rounded-lg" />
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card padding="md">
            <div className="h-5 w-28 bg-border-light rounded" />
            <div className="space-y-2 mt-4">
              <div className="h-10 bg-border-light rounded-lg" />
              <div className="h-10 bg-border-light rounded-lg" />
              <div className="h-10 bg-border-light rounded-lg" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
