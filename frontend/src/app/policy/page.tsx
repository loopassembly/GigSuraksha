import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { SAMPLE_POLICY } from '@/lib/mock-data';
import { DISRUPTION_TYPE_INFO } from '@/lib/constants';
import { formatCurrency } from '@/lib/calculations';
import {
  Shield,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
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
  const policy = SAMPLE_POLICY;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-10 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Policy Summary</h1>
            <p className="text-[14px] text-text-secondary mt-1">
              Active protection for {policy.weekLabel}
            </p>
          </div>
          <Badge variant="success">Active</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Policy Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Policy Card */}
            <Card padding="lg">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-text-primary">{policy.id}</p>
                  <p className="text-[13px] text-text-secondary">{policy.partnerName} — {policy.coverageTier.name} Plan</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <PolicyDetail icon={Calendar} label="Validity" value={policy.weekLabel} />
                <PolicyDetail icon={MapPin} label="Zone" value={policy.zone.name} />
                <PolicyDetail
                  icon={Clock}
                  label="Insured Shifts"
                  value={policy.shifts.map((s) => s.label.split('(')[0].trim()).join(', ')}
                />
                <PolicyDetail
                  icon={Shield}
                  label="Max Payout"
                  value={formatCurrency(policy.coverageTier.maxWeeklyPayout)}
                />
              </div>
            </Card>

            {/* Financial Summary */}
            <Card padding="lg">
              <CardHeader title="Financial Summary" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-primary-light">
                  <p className="text-[11px] font-medium text-primary uppercase tracking-wide">Weekly Premium</p>
                  <p className="text-[20px] font-bold text-text-primary mt-1">
                    {formatCurrency(policy.premium.finalWeeklyPremium)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-success-light">
                  <p className="text-[11px] font-medium text-success uppercase tracking-wide">Protected Income</p>
                  <p className="text-[20px] font-bold text-text-primary mt-1">
                    {formatCurrency(policy.protectedWeeklyIncome)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-border-light">
                  <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">Hourly Rate</p>
                  <p className="text-[20px] font-bold text-text-primary mt-1">
                    {formatCurrency(policy.protectedHourlyIncome)}/hr
                  </p>
                </div>
              </div>
            </Card>

            {/* Covered Triggers */}
            <Card padding="lg">
              <CardHeader
                title="Covered Disruptions"
                subtitle={`${policy.coverageTier.eligibleDisruptions.length} event types covered under ${policy.coverageTier.name} plan`}
              />
              <div className="space-y-2">
                {policy.coverageTier.eligibleDisruptions.map((dt) => {
                  const info = DISRUPTION_TYPE_INFO[dt];
                  return (
                    <div key={dt} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border">
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
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
                    View Claim Preview
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

            {/* Exclusions */}
            <Card padding="md">
              <CardHeader title="Exclusions" subtitle="Not covered under this plan" />
              <div className="space-y-2">
                {exclusions.map((ex) => (
                  <div key={ex} className="flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-text-secondary">{ex}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Important Note */}
            <Card padding="md" className="bg-warning-light border-warning/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-semibold text-warning">Important</p>
                  <p className="text-[12px] text-text-secondary mt-0.5">
                    Payouts are determined by a rules engine using verified external data. AI models assist with
                    classification and anomaly detection but do not make final payout decisions.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
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
