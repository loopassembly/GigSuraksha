'use client';

import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import {
  ADMIN_STATS,
  CLAIMS_BY_TYPE,
  ZONE_EXPOSURE,
  ANOMALY_ALERTS,
  FORECAST_INSIGHTS,
} from '@/lib/mock-data';
import { DISRUPTION_TYPE_INFO } from '@/lib/constants';
import { formatCurrency, formatCurrencyShort } from '@/lib/calculations';
import {
  Shield,
  FileWarning,
  IndianRupee,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  Eye,
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

const PIE_COLORS = ['#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

export default function AdminPage() {
  const stats = ADMIN_STATS;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 sm:py-10 w-full">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Operational overview — Week 12, March 2026
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Active Policies"
            value={stats.activePolicies.toLocaleString('en-IN')}
            change={stats.activePoliciesChange}
            icon={<Shield className="w-4 h-4 text-primary" />}
          />
          <StatCard
            label="Total Claims"
            value={stats.totalClaims.toLocaleString('en-IN')}
            change={stats.totalClaimsChange}
            icon={<FileWarning className="w-4 h-4 text-primary" />}
          />
          <StatCard
            label="Total Payouts"
            value={formatCurrencyShort(stats.totalPayouts)}
            change={stats.totalPayoutsChange}
            icon={<IndianRupee className="w-4 h-4 text-primary" />}
          />
          <StatCard
            label="Loss Ratio"
            value={`${(stats.lossRatio * 100).toFixed(0)}%`}
            change={stats.lossRatioChange}
            icon={<TrendingDown className="w-4 h-4 text-primary" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Claims by Type Chart */}
          <div className="lg:col-span-2">
            <Card padding="lg">
              <CardHeader
                title="Claims by Disruption Type"
                subtitle="Distribution of claims this week"
              />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CLAIMS_BY_TYPE} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="type"
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    />
                    <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Payout Distribution Pie */}
          <Card padding="lg">
            <CardHeader title="Payout Distribution" subtitle="By disruption category" />
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CLAIMS_BY_TYPE}
                    dataKey="amount"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                  >
                    {CLAIMS_BY_TYPE.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {CLAIMS_BY_TYPE.slice(0, 4).map((item, i) => (
                <div key={item.type} className="flex items-center gap-2 text-[11px]">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-text-secondary truncate">{item.type}</span>
                  <span className="ml-auto font-medium text-text-primary">{formatCurrencyShort(item.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Zone Exposure Table */}
          <Card padding="lg">
            <CardHeader title="Zone Exposure" subtitle="Active policies and risk by zone" />
            <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-text-muted text-[10px] uppercase tracking-wider">
                    <th className="pb-2 pr-3 font-medium">Zone</th>
                    <th className="pb-2 pr-3 font-medium">City</th>
                    <th className="pb-2 pr-3 font-medium">Policies</th>
                    <th className="pb-2 pr-3 font-medium">Risk</th>
                    <th className="pb-2 font-medium">Exposure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ZONE_EXPOSURE.map((ze) => (
                    <tr key={ze.zone}>
                      <td className="py-2.5 pr-3 font-medium text-text-primary">{ze.zone}</td>
                      <td className="py-2.5 pr-3 text-text-secondary">{ze.city}</td>
                      <td className="py-2.5 pr-3 text-text-primary">{ze.activePolicies.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 pr-3">
                        <Badge
                          variant={
                            ze.riskLevel === 'High' ? 'danger' : ze.riskLevel === 'Medium' ? 'warning' : 'success'
                          }
                        >
                          {ze.riskLevel}
                        </Badge>
                      </td>
                      <td className="py-2.5 font-medium text-text-primary">{formatCurrencyShort(ze.totalExposure)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Anomaly Alerts */}
          <Card padding="lg">
            <CardHeader
              title="Anomaly Alerts"
              subtitle="AI-flagged suspicious patterns"
              action={<Badge variant="danger">{ANOMALY_ALERTS.length} alerts</Badge>}
            />
            <div className="space-y-3">
              {ANOMALY_ALERTS.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'border-danger/30 bg-danger-light'
                      : 'border-warning/30 bg-warning-light'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {alert.severity === 'critical' ? (
                      <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[12px] font-semibold text-text-primary">{alert.type}</p>
                        <Badge variant={alert.severity === 'critical' ? 'danger' : 'warning'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-[12px] text-text-secondary">{alert.message}</p>
                      <p className="text-[11px] text-text-muted mt-1">{alert.zone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Forecast Insights */}
        <Card padding="lg" className="mb-6">
          <CardHeader
            title="Next-Week Disruption Forecast"
            subtitle="AI-generated risk predictions for Week 13 (Mar 23–29)"
            action={<Badge variant="info">AI Forecast</Badge>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FORECAST_INSIGHTS.map((insight) => {
              const info = DISRUPTION_TYPE_INFO[insight.riskType];
              return (
                <div key={insight.zone} className="p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] font-medium text-text-primary">{insight.zone}</p>
                    <span
                      className={`text-[12px] font-bold ${
                        insight.probability >= 0.7 ? 'text-danger' : insight.probability >= 0.5 ? 'text-warning' : 'text-success'
                      }`}
                    >
                      {Math.round(insight.probability * 100)}%
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary">{info?.label}</p>
                  <p className="text-[11px] text-text-muted mt-1">{insight.expectedImpact}</p>
                  <div className="mt-2 w-full h-1.5 bg-border-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${insight.probability * 100}%`,
                        backgroundColor: insight.probability >= 0.7 ? '#DC2626' : insight.probability >= 0.5 ? '#D97706' : '#059669',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 px-3 py-2.5 rounded-lg bg-border-light flex items-start gap-2">
            <Eye className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-secondary">
              Forecasts are generated by ML models trained on historical weather, infrastructure, and platform data.
              They inform risk pricing and reserve allocation — not direct payout decisions.
            </p>
          </div>
        </Card>
      </main>
    </>
  );
}
