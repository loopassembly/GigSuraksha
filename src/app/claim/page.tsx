import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { SAMPLE_POLICY, SAMPLE_DISRUPTIONS } from '@/lib/mock-data';
import { DISRUPTION_TYPE_INFO, SEVERITY_CONFIG } from '@/lib/constants';
import { calculatePayout, calculateShiftOverlap, formatCurrency } from '@/lib/calculations';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  ArrowRight,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function ClaimPage() {
  const policy = SAMPLE_POLICY;
  const event = SAMPLE_DISRUPTIONS[0]; // Heavy rain event
  const info = DISRUPTION_TYPE_INFO[event.type];
  const sevConfig = SEVERITY_CONFIG[event.severity];

  // Calculate shift overlap (event starts at 18:30, 3 hours)
  const shiftOverlap = calculateShiftOverlap(18.5, event.durationHours, policy.shifts);
  const payout = calculatePayout(
    policy.protectedHourlyIncome,
    shiftOverlap,
    event.severity,
    policy.coverageTier.maxWeeklyPayout
  );

  const validationChecks = [
    {
      id: 'zone',
      label: 'Zone Match',
      description: `Event zone (${event.zone}) matches policy zone (${policy.zone.name})`,
      passed: true,
    },
    {
      id: 'shift',
      label: 'Shift Overlap',
      description: `Event overlaps with Evening Rush shift by ${shiftOverlap} hours`,
      passed: shiftOverlap > 0,
    },
    {
      id: 'duplicate',
      label: 'Duplicate Check',
      description: 'No existing claim for this event and time period',
      passed: true,
    },
    {
      id: 'event',
      label: 'Event Validation',
      description: `Verified via ${event.dataSource}`,
      passed: true,
    },
    {
      id: 'anomaly',
      label: 'Anomaly Score',
      description: 'ML anomaly score: 0.12 (below 0.60 threshold)',
      passed: true,
    },
  ];

  const allPassed = validationChecks.every((c) => c.passed);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-10 w-full">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Claim Preview</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Automated claim assessment for disruption event {event.id}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <Card padding="lg">
              <CardHeader
                title="Triggering Event"
                action={
                  <Badge variant={event.severity === 'severe' ? 'danger' : event.severity === 'high' ? 'warning' : 'muted'}>
                    {sevConfig.label}
                  </Badge>
                }
              />
              <div className="p-4 rounded-lg bg-background border border-border mb-4">
                <p className="text-[14px] font-semibold text-text-primary">{info.label}</p>
                <p className="text-[13px] text-text-secondary mt-1">{event.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-[12px]">
                  <div>
                    <span className="text-text-muted">Zone</span>
                    <p className="font-medium text-text-primary">{event.zone}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Duration</span>
                    <p className="font-medium text-text-primary">{event.durationHours}h</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Time</span>
                    <p className="font-medium text-text-primary">6:30 PM – 9:30 PM</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Data Source</span>
                    <p className="font-medium text-text-primary">{event.dataSource}</p>
                  </div>
                </div>
              </div>

              {/* Linked Policy */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-text-primary">{policy.id}</p>
                  <p className="text-[12px] text-text-secondary">{policy.coverageTier.name} Plan — {policy.weekLabel}</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </Card>

            {/* Validation Checks */}
            <Card padding="lg">
              <CardHeader
                title="Validation Checks"
                subtitle="Automated verification pipeline"
                action={
                  allPassed ? (
                    <Badge variant="success">All Passed</Badge>
                  ) : (
                    <Badge variant="danger">Failed</Badge>
                  )
                }
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
                  Validation is performed by the rules engine. AI models assist with anomaly scoring
                  and event classification but do not determine eligibility.
                </p>
              </div>
            </Card>
          </div>

          {/* Payout Sidebar */}
          <div className="space-y-6">
            {/* Payout Calculation */}
            <Card padding="lg" className={allPassed ? 'ring-1 ring-success' : ''}>
              <CardHeader title="Payout Estimate" />
              {allPassed ? (
                <>
                  <div className="text-center mb-4">
                    <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                    <p className="text-[28px] font-bold text-success">{formatCurrency(payout)}</p>
                    <p className="text-[12px] text-text-secondary mt-1">Estimated payout amount</p>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-3 mb-4 font-mono text-[11px] text-text-secondary leading-relaxed">
                    <p className="text-text-muted text-[10px] mb-1">// Payout formula</p>
                    <p>min(</p>
                    <p className="pl-2">₹{policy.protectedHourlyIncome} × {shiftOverlap}h × {sevConfig.multiplier},</p>
                    <p className="pl-2">₹{policy.coverageTier.maxWeeklyPayout}</p>
                    <p>)</p>
                  </div>
                  <div className="space-y-2 text-[13px]">
                    <Row label="Protected Hourly Income" value={`${formatCurrency(policy.protectedHourlyIncome)}/hr`} />
                    <Row label="Shift Overlap" value={`${shiftOverlap} hours`} />
                    <Row label="Severity Multiplier" value={`${sevConfig.multiplier}x`} />
                    <Row label="Weekly Cap" value={formatCurrency(policy.coverageTier.maxWeeklyPayout)} />
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2" />
                  <p className="text-[14px] font-semibold text-danger">Claim Not Eligible</p>
                  <p className="text-[13px] text-text-secondary mt-1">
                    One or more validation checks failed. Review the checks for details.
                  </p>
                </div>
              )}
            </Card>

            {/* Status */}
            <Card padding="md">
              <CardHeader title="Claim Status" />
              <div className="space-y-3">
                <StatusStep label="Event Detected" status="complete" />
                <StatusStep label="Validation Checks" status="complete" />
                <StatusStep label="Payout Calculated" status="complete" />
                <StatusStep label="Processing" status="active" />
                <StatusStep label="Payout Credited" status="pending" />
              </div>
            </Card>

            <Link href="/dashboard">
              <Button variant="outline" fullWidth>
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
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
      <span
        className={`text-[13px] ${
          status === 'pending' ? 'text-text-muted' : 'font-medium text-text-primary'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
