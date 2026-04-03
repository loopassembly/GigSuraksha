'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { ApiError, getWorkerClaims } from '@/lib/api';
import {
  describeValidationChecks,
  findEventForClaim,
  formatCurrencyValue,
  formatDateTime,
  formatNumber,
  getClaimStatusBadgeVariant,
  getEventInfo,
  getPayoutStatusBadgeVariant,
} from '@/lib/backend-helpers';
import { getEvent, getPolicy, getWorker } from '@/lib/store';
import type { BackendClaim, BackendEvent, BackendPolicy, StoredWorker } from '@/lib/types';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  FileText,
  Shield,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function ClaimPage() {
  const [worker, setWorker] = useState<StoredWorker | null>(null);
  const [policy, setPolicy] = useState<BackendPolicy | null>(null);
  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [claims, setClaims] = useState<BackendClaim[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWorker(getWorker());
    setPolicy(getPolicy());
    setEvent(getEvent()?.event ?? null);
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

    async function loadClaims() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getWorkerClaims(stableWorkerId);
        if (cancelled) {
          return;
        }
        setClaims(response);
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        if (requestError instanceof ApiError) {
          setError(requestError.detail || requestError.message);
        } else {
          setError('Unable to load claim history right now.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadClaims();

    return () => {
      cancelled = true;
    };
  }, [isReady, worker]);

  const latestClaim =
    [...claims].sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    )[0] ?? null;

  const linkedEvent = findEventForClaim(event, latestClaim);
  const eventInfo = latestClaim ? getEventInfo(latestClaim.event_type) : null;
  const validationChecks = latestClaim ? describeValidationChecks(latestClaim.validation_checks, latestClaim) : [];
  const allPassed = validationChecks.every((check) => check.passed) && latestClaim?.status === 'approved';

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-10 w-full">
        {isLoading ? (
          <ClaimSkeleton />
        ) : !worker ? (
          <EmptyState
            title="Register a Worker First"
            description="Claim history depends on the worker profile stored during onboarding."
            href="/onboarding"
            cta="Go to Onboarding"
          />
        ) : !latestClaim ? (
          <EmptyState
            title="No Claims Yet"
            description="Trigger a disruption simulation after activating a policy to create and review live claims here."
            href="/simulate"
            cta="Try Simulation"
          />
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Claim Preview</h1>
              <p className="text-[14px] text-text-secondary mt-1">
                Latest automated claim assessment for worker {worker.name}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card padding="lg">
                  <CardHeader
                    title="Triggering Event"
                    action={<Badge variant={getClaimStatusBadgeVariant(latestClaim.status)}>{latestClaim.status}</Badge>}
                  />
                  <div className="p-4 rounded-lg bg-background border border-border mb-4">
                    <p className="text-[14px] font-semibold text-text-primary">{eventInfo?.label ?? latestClaim.event_type}</p>
                    <p className="text-[13px] text-text-secondary mt-1">
                      Auto-generated from the live backend event trigger pipeline.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-[12px]">
                      <div>
                        <span className="text-text-muted">Zone</span>
                        <p className="font-medium text-text-primary">{latestClaim.zone}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Affected Hours</span>
                        <p className="font-medium text-text-primary">{formatNumber(latestClaim.affected_hours, 1)}h</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Severity</span>
                        <p className="font-medium text-text-primary capitalize">{latestClaim.severity}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Detected</span>
                        <p className="font-medium text-text-primary">
                          {linkedEvent ? formatDateTime(linkedEvent.start_time) : formatDateTime(latestClaim.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-text-primary">{latestClaim.policy_id}</p>
                      <p className="text-[12px] text-text-secondary">
                        {policy ? `${policy.coverage_tier} plan - ${policy.zone}, ${policy.city}` : 'Linked live policy snapshot'}
                      </p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                </Card>

                <Card padding="lg">
                  <CardHeader
                    title="Validation Checks"
                    subtitle="Rules-engine verification pipeline"
                    action={allPassed ? <Badge variant="success">All Passed</Badge> : <Badge variant="danger">Review</Badge>}
                  />
                  <div className="space-y-2">
                    {validationChecks.map((check) => (
                      <div
                        key={check.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          check.passed ? 'border-border bg-surface' : 'border-danger/30 bg-danger-light'
                        }`}
                      >
                        {check.passed ? (
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-[13px] font-medium text-text-primary">{check.label}</p>
                          <p className="text-[12px] text-text-secondary">{check.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 px-3 py-2.5 rounded-lg bg-border-light flex items-start gap-2">
                    <FileText className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-text-secondary">
                      Claim approval is deterministic. The backend stores these validation flags directly on every created claim.
                    </p>
                  </div>
                </Card>

                <Card padding="lg">
                  <CardHeader
                    title="Fraud & Integrity Signals"
                    subtitle="Anomaly checks applied before payout processing"
                    action={
                      <Badge
                        variant={
                          latestClaim.anomaly_band === 'HIGH'
                            ? 'danger'
                            : latestClaim.anomaly_band === 'MEDIUM'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {latestClaim.anomaly_band}
                      </Badge>
                    }
                  />
                  <div className="grid grid-cols-2 gap-3 mb-4 text-[12px]">
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <p className="text-text-muted">Anomaly Score</p>
                      <p className="font-semibold text-text-primary mt-1">{latestClaim.anomaly_score}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <p className="text-text-muted">Payout Status</p>
                      <div className="mt-1">
                        <Badge variant={getPayoutStatusBadgeVariant(latestClaim.payout_status)}>
                          {latestClaim.payout_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {latestClaim.anomaly_reasons.map((reason) => (
                      <div key={reason} className="px-3 py-2 rounded-lg border border-border bg-background">
                        <p className="text-[12px] text-text-primary capitalize">{reason}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card padding="lg" className={allPassed ? 'ring-1 ring-success' : ''}>
                  <CardHeader title="Payout Estimate" />
                  {allPassed ? (
                    <>
                      <div className="text-center mb-4">
                        <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                        <p className="text-[28px] font-bold text-success">{formatCurrencyValue(latestClaim.payout_amount)}</p>
                        <p className="text-[12px] text-text-secondary mt-1">Estimated payout amount</p>
                      </div>
                      <div className="bg-background border border-border rounded-lg p-3 mb-4 font-mono text-[11px] text-text-secondary leading-relaxed">
                        <p className="text-text-muted text-[10px] mb-1">{'// Payout formula'}</p>
                        <p>min(</p>
                        <p className="pl-2">
                          {formatCurrencyValue(latestClaim.protected_hourly_income)} x {formatNumber(latestClaim.affected_hours, 1)}h x{' '}
                          {latestClaim.severity_multiplier},
                        </p>
                        <p className="pl-2">policy cap</p>
                        <p>)</p>
                      </div>
                      <div className="space-y-2 text-[13px]">
                        <Row label="Protected Hourly Income" value={`${formatCurrencyValue(latestClaim.protected_hourly_income)}/hr`} />
                        <Row label="Shift Overlap" value={`${formatNumber(latestClaim.affected_hours, 1)} hours`} />
                        <Row label="Severity Multiplier" value={`${latestClaim.severity_multiplier}x`} />
                        <Row label="Claim Status" value={latestClaim.status} />
                        <Row label="Payout Status" value={latestClaim.payout_status} />
                        <Row label="Payout Reference" value={latestClaim.payout_reference || 'Pending'} />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2" />
                      <p className="text-[14px] font-semibold text-danger">Claim Needs Review</p>
                      <p className="text-[13px] text-text-secondary mt-1">
                        One or more validation checks failed. Review the checks for details.
                      </p>
                    </div>
                  )}
                </Card>

                <Card padding="md">
                  <CardHeader title="Claim Status" />
                  <div className="space-y-3">
                    <StatusStep label="Event Detected" status="complete" />
                    <StatusStep label="Validation Checks" status="complete" />
                    <StatusStep label="Claim Created" status="complete" />
                    <StatusStep label="Approval" status={latestClaim.status === 'approved' ? 'complete' : 'active'} />
                    <StatusStep label="Payout Ready" status={latestClaim.status === 'approved' ? 'active' : 'pending'} />
                  </div>
                </Card>

                {error && (
                  <Card padding="md" className="border-danger/30 bg-danger-light">
                    <p className="text-[13px] text-danger">{error}</p>
                  </Card>
                )}

                <Link href="/dashboard">
                  <Button variant="outline" fullWidth>
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function EmptyState({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Card padding="lg">
      <h1 className="text-xl font-bold text-text-primary">{title}</h1>
      <p className="text-[14px] text-text-secondary mt-1">{description}</p>
      <div className="mt-4">
        <Link href={href}>
          <Button>
            {cta}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

function StatusStep({ label, status }: { label: string; status: 'complete' | 'active' | 'pending' }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          status === 'complete'
            ? 'bg-success text-white'
            : status === 'active'
            ? 'bg-primary text-white'
            : 'bg-border-light text-text-muted'
        }`}
      >
        {status === 'complete' ? (
          <CheckCircle className="w-3.5 h-3.5" />
        ) : (
          <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-white' : 'bg-text-muted'}`} />
        )}
      </div>
      <span className={status === 'pending' ? 'text-[13px] text-text-muted' : 'text-[13px] font-medium text-text-primary'}>
        {label}
      </span>
    </div>
  );
}

function ClaimSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-border-light rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <div className="h-5 w-44 bg-border-light rounded" />
            <div className="h-28 bg-border-light rounded-lg mt-4" />
          </Card>
          <Card padding="lg">
            <div className="h-5 w-40 bg-border-light rounded" />
            <div className="space-y-2 mt-4">
              <div className="h-16 bg-border-light rounded-lg" />
              <div className="h-16 bg-border-light rounded-lg" />
              <div className="h-16 bg-border-light rounded-lg" />
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card padding="lg">
            <div className="h-5 w-32 bg-border-light rounded" />
            <div className="h-24 bg-border-light rounded-lg mt-4" />
          </Card>
        </div>
      </div>
    </div>
  );
}
