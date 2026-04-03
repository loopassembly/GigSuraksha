'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { ApiError, getAdminSummary, getAllClaims, runTriggerMonitor } from '@/lib/api';
import {
  formatCurrencyValue,
  formatDateTime,
  formatNumber,
  getClaimStatusBadgeVariant,
  getEventInfo,
  getPayoutStatusBadgeVariant,
  getRiskBadgeVariant,
  getShiftLabel,
} from '@/lib/backend-helpers';
import { formatCurrencyShort } from '@/lib/calculations';
import type { AdminSummary, BackendClaim, TriggerMonitorRunResponse } from '@/lib/types';
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Eye,
  FileWarning,
  Shield,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

export default function AdminPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [allClaims, setAllClaims] = useState<BackendClaim[]>([]);
  const [monitorResult, setMonitorResult] = useState<TriggerMonitorRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMonitorRunning, setIsMonitorRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAdmin() {
      setIsLoading(true);
      setError(null);

      try {
        const [summaryResponse, claimsResponse] = await Promise.all([getAdminSummary(), getAllClaims()]);
        if (cancelled) {
          return;
        }
        setSummary(summaryResponse);
        setAllClaims(claimsResponse);
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        if (requestError instanceof ApiError) {
          setError(requestError.detail || requestError.message);
        } else {
          setError('Unable to load the admin dashboard right now.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAdmin();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalPayouts = allClaims.reduce(
    (sum, claim) => sum + (claim.payout_status === 'processed' ? claim.payout_amount : 0),
    0
  );
  const claimsByType =
    summary?.claims_by_event_type
      ? Object.entries(summary.claims_by_event_type).map(([eventType, count]) => ({
          type: getEventInfo(eventType).label,
          count,
        }))
      : [];
  const claimsByStatus =
    summary?.claims_by_status
      ? Object.entries(summary.claims_by_status).map(([status, count]) => ({
          status,
          count,
        }))
      : [];

  async function handleRunMonitor() {
    setIsMonitorRunning(true);
    setError(null);
    try {
      const result = await runTriggerMonitor();
      const [summaryResponse, claimsResponse] = await Promise.all([getAdminSummary(), getAllClaims()]);
      setMonitorResult(result);
      setSummary(summaryResponse);
      setAllClaims(claimsResponse);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.detail || requestError.message);
      } else {
        setError('Unable to run the automated trigger monitor right now.');
      }
    } finally {
      setIsMonitorRunning(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 sm:py-10 w-full">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Live operational summary from the deployed GigSuraksha backend
          </p>
          <div className="mt-4">
            <Button onClick={handleRunMonitor} disabled={isMonitorRunning}>
              {isMonitorRunning ? 'Running Trigger Monitor...' : 'Run Automated Trigger Monitor'}
              {!isMonitorRunning && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-3 py-2.5 rounded-lg bg-danger-light border border-danger/20 text-[13px] text-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <AdminSkeleton />
        ) : summary ? (
          <>
            {monitorResult && (
              <Card padding="md" className="mb-6">
                <CardHeader title="Latest Monitor Run" action={<Badge variant="info">{monitorResult.monitor_run_id}</Badge>} />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <p className="text-text-muted">Policies Scanned</p>
                    <p className="font-semibold text-text-primary mt-1">{monitorResult.policies_scanned}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <p className="text-text-muted">Candidate Events</p>
                    <p className="font-semibold text-text-primary mt-1">{monitorResult.candidate_events.length}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <p className="text-text-muted">Events Created</p>
                    <p className="font-semibold text-text-primary mt-1">{monitorResult.events_created}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <p className="text-text-muted">Claims Created</p>
                    <p className="font-semibold text-text-primary mt-1">{monitorResult.claims_created}</p>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <StatCard
                label="Registered Workers"
                value={summary.total_workers.toLocaleString('en-IN')}
                icon={<Shield className="w-4 h-4 text-primary" />}
                subtitle="Workers in system"
              />
              <StatCard
                label="Active Policies"
                value={summary.total_active_policies.toLocaleString('en-IN')}
                icon={<Shield className="w-4 h-4 text-primary" />}
                subtitle="Current active cover"
              />
              <StatCard
                label="Total Events"
                value={summary.total_events.toLocaleString('en-IN')}
                icon={<AlertTriangle className="w-4 h-4 text-primary" />}
                subtitle="Verified event records"
              />
              <StatCard
                label="Total Claims"
                value={summary.total_claims.toLocaleString('en-IN')}
                icon={<FileWarning className="w-4 h-4 text-primary" />}
                subtitle={`Payouts ${formatCurrencyShort(totalPayouts)}`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <Card padding="lg">
                  <CardHeader title="Claims by Disruption Type" subtitle="Live claim counts by backend event type" />
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={claimsByType} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis
                          dataKey="type"
                          tick={{ fontSize: 11, fill: '#94A3B8' }}
                          tickLine={false}
                          axisLine={{ stroke: '#E2E8F0' }}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                          height={64}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <Card padding="lg">
                <CardHeader title="Claims by Status" subtitle="Current claim pipeline mix" />
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={claimsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                        {claimsByStatus.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 mt-2">
                  {claimsByStatus.map((item, index) => (
                    <div key={item.status} className="flex items-center gap-2 text-[11px]">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="text-text-secondary truncate">{item.status}</span>
                      <span className="ml-auto font-medium text-text-primary">{item.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card padding="lg">
                <CardHeader title="Recent Events" subtitle="Latest backend event records" />
                <div className="space-y-3">
                  {summary.recent_events.length > 0 ? (
                    summary.recent_events.map((event) => (
                      <div key={event.event_id} className="p-3 rounded-lg border border-border bg-background">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-medium text-text-primary">{getEventInfo(event.event_type).label}</p>
                            <p className="text-[12px] text-text-secondary">{event.zone}, {event.city}</p>
                          </div>
                          <Badge variant={event.severity === 'severe' ? 'danger' : event.severity === 'high' ? 'warning' : 'muted'}>
                            {event.severity}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-text-muted mt-2">
                          {formatDateTime(event.start_time)} • {formatNumber(event.duration_hours, 1)}h • {event.source}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[12px] text-text-secondary">No recent events available.</p>
                  )}
                </div>
              </Card>

              <Card padding="lg">
                <CardHeader title="Recent Claims" subtitle="Latest auto-created claim records" />
                <div className="space-y-3">
                  {summary.recent_claims.length > 0 ? (
                    summary.recent_claims.map((claim) => (
                      <div key={claim.claim_id} className="p-3 rounded-lg border border-border bg-background">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-medium text-text-primary">{claim.claim_id}</p>
                            <p className="text-[12px] text-text-secondary">{getEventInfo(claim.event_type).label}</p>
                          </div>
                          <Badge variant={getClaimStatusBadgeVariant(claim.status)}>{claim.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[12px]">
                          <span className="text-text-secondary">{claim.zone}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={getPayoutStatusBadgeVariant(claim.payout_status)}>{claim.payout_status}</Badge>
                            <span className="font-medium text-text-primary">{formatCurrencyValue(claim.payout_amount)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[12px] text-text-secondary">No recent claims available.</p>
                  )}
                </div>
              </Card>
            </div>

            <Card padding="lg" className="mb-6">
              <CardHeader
                title="Next-Week Disruption Forecast"
                subtitle="Forecast cards exposed by the backend for demo and admin views"
                action={<Badge variant="info">ML Forecast</Badge>}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {summary.forecast_cards.map((card) => (
                  <div key={`${card.city}-${card.zone}-${card.shift_type}`} className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-[13px] font-medium text-text-primary">{card.zone}</p>
                      <Badge variant={getRiskBadgeVariant(card.risk_band)}>{card.risk_band}</Badge>
                    </div>
                    <p className="text-[12px] text-text-secondary">{card.city} • {getShiftLabel(card.shift_type)}</p>
                    <div className="mt-3 space-y-1 text-[12px]">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Risk Score</span>
                        <span className="font-medium text-text-primary">{card.risk_score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Expected Hours</span>
                        <span className="font-medium text-text-primary">{formatNumber(card.expected_disrupted_hours)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Suggested Premium</span>
                        <span className="font-medium text-text-primary">{formatCurrencyValue(card.suggested_weekly_premium)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 px-3 py-2.5 rounded-lg bg-border-light flex items-start gap-2">
                <Eye className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-text-secondary">
                  Forecast cards are useful for demo dashboards. Claim approval still stays separate from ML and remains rule-based.
                </p>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                  <Clock3 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-text-primary">Operational Snapshot</p>
                  <p className="text-[12px] text-text-secondary mt-0.5">
                    Total live payouts so far: {formatCurrencyValue(totalPayouts)} across {allClaims.length} claim records.
                  </p>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card padding="lg">
            <p className="text-[14px] text-text-secondary">Admin summary could not be loaded.</p>
          </Card>
        )}
      </main>
    </>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="h-28 bg-border-light rounded-lg" />
        <div className="h-28 bg-border-light rounded-lg" />
        <div className="h-28 bg-border-light rounded-lg" />
        <div className="h-28 bg-border-light rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-border-light rounded-lg" />
        <div className="h-80 bg-border-light rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-border-light rounded-lg" />
        <div className="h-64 bg-border-light rounded-lg" />
      </div>
    </div>
  );
}
