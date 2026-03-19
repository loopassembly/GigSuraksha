import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { SAMPLE_POLICY, SAMPLE_CLAIMS, SAMPLE_DISRUPTIONS } from '@/lib/mock-data';
import { DISRUPTION_TYPE_INFO } from '@/lib/constants';
import { formatCurrency } from '@/lib/calculations';
import {
  Shield,
  IndianRupee,
  Clock,
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const policy = SAMPLE_POLICY;
  const claims = SAMPLE_CLAIMS;
  const recentDisruptions = SAMPLE_DISRUPTIONS.slice(0, 3);
  const totalPaid = claims.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 sm:py-10 w-full">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Welcome back, Ravi</h1>
            <p className="text-[14px] text-text-secondary mt-0.5">
              Your income protection dashboard for {policy.weekLabel}
            </p>
          </div>
          <Link href="/policy">
            <Button variant="outline" size="sm">
              View Policy
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Weekly Premium"
            value={formatCurrency(policy.premium.finalWeeklyPremium)}
            icon={<IndianRupee className="w-4 h-4 text-primary" />}
            subtitle={policy.coverageTier.name + ' Plan'}
          />
          <StatCard
            label="Protected Income"
            value={formatCurrency(policy.protectedWeeklyIncome)}
            icon={<Shield className="w-4 h-4 text-primary" />}
            subtitle={`${policy.coverageTier.coveragePercent}% coverage`}
          />
          <StatCard
            label="Total Payouts"
            value={formatCurrency(totalPaid)}
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
            subtitle={`${claims.filter((c) => c.status === 'paid').length} claims paid`}
          />
          <StatCard
            label="Max Weekly Payout"
            value={formatCurrency(policy.coverageTier.maxWeeklyPayout)}
            icon={<CalendarCheck className="w-4 h-4 text-primary" />}
            subtitle="Weekly cap"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Policy */}
          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg">
              <CardHeader
                title="Active Policy"
                action={<Badge variant="success">Active</Badge>}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
                <div>
                  <span className="text-text-muted text-[11px] uppercase tracking-wide">Policy ID</span>
                  <p className="font-medium text-text-primary mt-0.5">{policy.id}</p>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] uppercase tracking-wide">Zone</span>
                  <p className="font-medium text-text-primary mt-0.5">{policy.zone.name}</p>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] uppercase tracking-wide">Shifts</span>
                  <p className="font-medium text-text-primary mt-0.5">
                    {policy.shifts.map((s) => s.label.split('(')[0].trim()).join(', ')}
                  </p>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] uppercase tracking-wide">Validity</span>
                  <p className="font-medium text-text-primary mt-0.5">Mar 16–22, 2026</p>
                </div>
              </div>
            </Card>

            {/* Claim History */}
            <Card padding="lg">
              <CardHeader
                title="Claim History"
                subtitle="Your recent disruption claims and payouts"
                action={
                  <Link href="/claim">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                }
              />
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
                      <tr key={claim.id}>
                        <td className="py-3 pr-3 text-text-secondary">{claim.date}</td>
                        <td className="py-3 pr-3 font-medium text-text-primary">
                          {DISRUPTION_TYPE_INFO[claim.disruptionType]?.label || claim.disruptionType}
                        </td>
                        <td className="py-3 pr-3 text-text-secondary">{claim.affectedHours}h</td>
                        <td className="py-3 pr-3 font-medium text-text-primary">
                          {formatCurrency(claim.amount)}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={
                              claim.status === 'paid'
                                ? 'success'
                                : claim.status === 'processing'
                                ? 'warning'
                                : claim.status === 'rejected'
                                ? 'danger'
                                : 'muted'
                            }
                          >
                            {claim.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Disruptions */}
            <Card padding="md">
              <CardHeader title="Recent Disruptions" subtitle="Events near your zone" />
              <div className="space-y-3">
                {recentDisruptions.map((event) => {
                  const info = DISRUPTION_TYPE_INFO[event.type];
                  return (
                    <div key={event.id} className="p-3 rounded-lg border border-border bg-background">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-[13px] font-medium text-text-primary">{info?.label}</p>
                        <Badge
                          variant={
                            event.severity === 'severe'
                              ? 'danger'
                              : event.severity === 'high'
                              ? 'warning'
                              : 'muted'
                          }
                        >
                          {event.severity}
                        </Badge>
                      </div>
                      <p className="text-[12px] text-text-secondary">{event.zone}, {event.city}</p>
                      <p className="text-[11px] text-text-muted mt-1">{event.durationHours}h duration</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Quick Actions */}
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
      </main>
    </>
  );
}
