'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { ApiError, getAdminSummary, getWorkerClaims, getWorkerPolicies } from '@/lib/api';
import {
  formatCurrencyValue,
  formatDateRange,
  formatDateTime,
  formatNumber,
  getClaimStatusBadgeVariant,
  getEventInfo,
  getPolicyStatusBadgeVariant,
  getShiftLabel,
} from '@/lib/backend-helpers';
import { getWorker } from '@/lib/store';
import type { AdminSummary, BackendClaim, BackendPolicy, StoredWorker } from '@/lib/types';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Clock,
  IndianRupee,
  Shield,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [worker, setWorker] = useState<StoredWorker | null>(null);
  const [policy, setPolicy] = useState<BackendPolicy | null>(null);
  const [claims, setClaims] = useState<BackendClaim[]>([]);
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWorker(getWorker());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    const workerId = worker?.worker_id;
    if (!workerId) {
      setIsLoading(false);
      return;
    }
    const stableWorkerId = workerId;

    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const [policies, workerClaims, summary] = await Promise.all([
          getWorkerPolicies(stableWorkerId),
          getWorkerClaims(stableWorkerId),
          getAdminSummary(),
        ]);

        if (cancelled) {
          return;
        }

        setPolicy(policies.find((item) => item.status === 'active') ?? policies[0] ?? null);
        setClaims(
          [...workerClaims].sort(
            (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
          )
        );
        setAdminSummary(summary);
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        if (requestError instanceof ApiError) {
          setError(requestError.detail || requestError.message);
        } else {
          setError('Unable to load the worker dashboard right now.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [isReady, worker]);

  const totalPaid = claims.reduce(
    (sum, claim) => sum + (claim.payout_status === 'processed' ? claim.payout_amount : 0),
    0
  );
  const recentEvents = adminSummary?.recent_events ?? [];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 sm:py-10 w-full">
        {isLoading ? (
          <DashboardSkeleton />
        ) : !worker ? (
          <Card padding="lg">
            <h1 className="text-xl font-bold text-text-primary">Register to Unlock Your Dashboard</h1>
            <p className="text-[14px] text-text-secondary mt-1">
              We need a registered worker profile before we can load your policy and claims from the deployed backend.
            </p>
            <div className="mt-4">
              <Link href="/onboarding">
                <Button>
                  Go to Onboarding
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Welcome back, {worker.name}</h1>
                <p className="text-[14px] text-text-secondary mt-0.5">
                  Your live protection dashboard for {worker.zone}, {worker.display_city}
                </p>
              </div>
              <Link href="/policy">
                <Button variant="outline" size="sm">
                  View Policy
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {error && (
              <div className="mb-6 px-3 py-2.5 rounded-lg bg-danger-light border border-danger/20 text-[13px] text-danger">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <StatCard
                label="Weekly Premium"
                value={policy ? formatCurrencyValue(policy.weekly_premium) : 'N/A'}
                icon={<IndianRupee className="w-4 h-4 text-primary" />}
                subtitle={policy ? `${policy.coverage_tier} plan` : 'No active policy'}
              />
              <StatCard
                label="Protected Income"
                value={policy ? formatCurrencyValue(policy.coverage_summary.protected_weekly_income) : 'N/A'}
                icon={<Shield className="w-4 h-4 text-primary" />}
                subtitle={policy ? `${policy.coverage_percent}% coverage` : 'Quote required'}
              />
              <StatCard
                label="Claim Payouts"
                value={formatCurrencyValue(totalPaid)}
                icon={<TrendingUp className="w-4 h-4 text-primary" />}
                subtitle={`${claims.length} total claims`}
              />
              <StatCard
                label="Max Weekly Payout"
                value={policy ? formatCurrencyValue(policy.max_weekly_payout) : 'N/A'}
                icon={<CalendarCheck className="w-4 h-4 text-primary" />}
                subtitle="Policy cap"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card padding="lg">
                  <CardHeader
                    title="Active Policy"
                    action={policy ? <Badge variant={getPolicyStatusBadgeVariant(policy.status)}>{policy.status}</Badge> : undefined}
                  />
                  {policy ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
                      <div>
                        <span className="text-text-muted text-[11px] uppercase tracking-wide">Policy ID</span>
                        <p className="font-medium text-text-primary mt-0.5">{policy.policy_id}</p>
                      </div>
                      <div>
                        <span className="text-text-muted text-[11px] uppercase tracking-wide">Zone</span>
                        <p className="font-medium text-text-primary mt-0.5">{policy.zone}</p>
                      </div>
                      <div>
                        <span className="text-text-muted text-[11px] uppercase tracking-wide">Insured Shift</span>
                        <p className="font-medium text-text-primary mt-0.5">{getShiftLabel(policy.shift_type)}</p>
                      </div>
                      <div>
                        <span className="text-text-muted text-[11px] uppercase tracking-wide">Validity</span>
                        <p className="font-medium text-text-primary mt-0.5">
                          {formatDateRange(policy.valid_from, policy.valid_to)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-medium text-text-primary">No active policy yet</p>
                        <p className="text-[12px] text-text-secondary mt-0.5">
                          Generate a quote and activate a policy to unlock automated claim protection.
                        </p>
                      </div>
                    </div>
                  )}
                </Card>

                <Card padding="lg">
                  <CardHeader
                    title="Claim History"
                    subtitle="Live claims created from simulated disruptions"
                    action={
                      <Link href="/claim">
                        <Button variant="ghost" size="sm">View Latest</Button>
                      </Link>
                    }
                  />
                  {claims.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="text-left text-text-muted text-[11px] uppercase tracking-wider">
                            <th className="pb-2 pr-3 font-medium">Date</th>
                            <th className="pb-2 pr-3 font-medium">Disruption</th>
                            <th className="pb-2 pr-3 font-medium">Hours</th>
                            <th className="pb-2 pr-3 font-medium">Amount</th>
                            <th className="pb-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {claims.map((claim) => (
                            <tr key={claim.claim_id}>
                              <td className="py-3 pr-3 text-text-secondary">{formatDateTime(claim.created_at)}</td>
                              <td className="py-3 pr-3 font-medium text-text-primary">{getEventInfo(claim.event_type).label}</td>
                              <td className="py-3 pr-3 text-text-secondary">{formatNumber(claim.affected_hours, 1)}h</td>
                              <td className="py-3 pr-3 font-medium text-text-primary">
                                {formatCurrencyValue(claim.payout_amount)}
                              </td>
                              <td className="py-3">
                                <Badge variant={getClaimStatusBadgeVariant(claim.status)}>{claim.status}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[13px] text-text-secondary">
                      No live claims yet. Use the simulation page to trigger a disruption once your policy is active.
                    </p>
                  )}
                </Card>
              </div>

              <div className="space-y-6">
                <Card padding="md">
                  <CardHeader title="Recent Disruptions" subtitle="Latest backend events" />
                  {recentEvents.length > 0 ? (
                    <div className="space-y-3">
                      {recentEvents.map((event) => (
                        <div key={event.event_id} className="p-3 rounded-lg border border-border bg-background">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-[13px] font-medium text-text-primary">{getEventInfo(event.event_type).label}</p>
                            <Badge variant={event.severity === 'severe' ? 'danger' : event.severity === 'high' ? 'warning' : 'muted'}>
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-[12px] text-text-secondary">{event.zone}, {event.city}</p>
                          <p className="text-[11px] text-text-muted mt-1">
                            {formatNumber(event.duration_hours, 1)}h • {formatDateTime(event.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-text-secondary">No recent live events available yet.</p>
                  )}
                </Card>

                <Card padding="md">
                  <CardHeader title="Quick Actions" />
                  <div className="space-y-2">
                    <Link href="/simulate" className="block">
                      <Button variant="outline" size="sm" fullWidth>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Simulate Disruption
                      </Button>
                    </Link>
                    <Link href="/claim" className="block">
                      <Button variant="outline" size="sm" fullWidth>
                        <Clock className="w-3.5 h-3.5" />
                        View Latest Claim
                      </Button>
                    </Link>
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-border-light rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="h-28 bg-border-light rounded-lg" />
        <div className="h-28 bg-border-light rounded-lg" />
        <div className="h-28 bg-border-light rounded-lg" />
        <div className="h-28 bg-border-light rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <div className="h-20 bg-border-light rounded-lg" />
          </Card>
          <Card padding="lg">
            <div className="h-48 bg-border-light rounded-lg" />
          </Card>
        </div>
        <div className="space-y-6">
          <Card padding="md">
            <div className="h-40 bg-border-light rounded-lg" />
          </Card>
        </div>
      </div>
    </div>
  );
}
