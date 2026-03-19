'use client';

import Header from '@/components/Header';
import Card, { CardHeader } from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { SAMPLE_PARTNER } from '@/lib/mock-data';
import { calculateRiskProfile, calculatePremium, formatCurrency } from '@/lib/calculations';
import { COVERAGE_TIERS, DISRUPTION_TYPE_INFO } from '@/lib/constants';
import { ArrowRight, Shield, TrendingUp, Info } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function QuotePage() {
  const partner = SAMPLE_PARTNER;
  const risk = calculateRiskProfile(partner.zone, partner.shifts, partner.city);
  const [tierIdx, setTierIdx] = useState(1); // default Standard
  const tier = COVERAGE_TIERS[tierIdx];
  const premium = calculatePremium(partner.zone, partner.shifts, partner.weeklyEarnings, tier.coveragePercent);
  const protectedIncome = Math.round((partner.weeklyEarnings * tier.coveragePercent) / 100);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-10 w-full">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Your Risk Assessment & Quote</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Based on your zone, shift timing, and earnings — here is your personalized weekly protection quote.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Profile */}
          <Card padding="lg">
            <CardHeader
              title="Risk Profile"
              subtitle={`${partner.zone.name}, ${partner.city}`}
              action={
                <Badge variant={risk.tier === 'high' ? 'danger' : risk.tier === 'moderate' ? 'warning' : 'success'}>
                  {risk.tier} risk
                </Badge>
              }
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
                    stroke={risk.tier === 'high' ? '#DC2626' : risk.tier === 'moderate' ? '#D97706' : '#059669'}
                    strokeWidth="8"
                    strokeDasharray={`${risk.overall * 2.64} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[18px] font-bold text-text-primary">{risk.overall}</span>
                </div>
              </div>
              <div className="text-[13px] text-text-secondary leading-relaxed">
                Your zone and shift pattern result in a {risk.tier}-risk profile.
                This score factors in weather exposure, infrastructure reliability, and shift timing.
              </div>
            </div>
            <div className="space-y-2.5">
              {risk.factors.map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-text-secondary">{f.label}</span>
                    <span className="text-[12px] font-semibold text-text-primary">{f.score}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${f.score}%`, backgroundColor: f.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Premium Quote */}
          <div className="space-y-6">
            {/* Coverage Tier Selector */}
            <Card padding="lg">
              <CardHeader title="Coverage Tier" subtitle="Select your protection level" />
              <div className="grid grid-cols-3 gap-2">
                {COVERAGE_TIERS.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => setTierIdx(i)}
                    className={`p-3 rounded-lg border text-center transition-colors cursor-pointer ${
                      i === tierIdx
                        ? 'border-primary bg-primary-light'
                        : 'border-border bg-surface hover:border-primary/40'
                    }`}
                  >
                    <p className="text-[13px] font-semibold text-text-primary">{t.name}</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">{t.coveragePercent}% coverage</p>
                    <p className="text-[12px] font-bold text-primary mt-1">
                      Up to {formatCurrency(t.maxWeeklyPayout)}
                    </p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Premium Breakdown */}
            <Card padding="lg">
              <CardHeader title="Weekly Premium Breakdown" />
              <div className="space-y-2">
                <PremiumLine label="Base Premium" value={premium.basePremium} />
                <PremiumLine label="Zone Risk Loading" value={premium.zoneRiskLoading} />
                <PremiumLine label="Shift Exposure Loading" value={premium.shiftExposureLoading} />
                <PremiumLine label="Coverage Factor" value={premium.coverageFactor} />
                <PremiumLine label="Safe Zone Discount" value={-premium.safeZoneDiscount} isDiscount />
                <div className="border-t border-border pt-3 mt-3 flex justify-between items-baseline">
                  <span className="text-[14px] font-semibold text-text-primary">Weekly Premium</span>
                  <span className="text-[22px] font-bold text-primary">
                    {formatCurrency(premium.finalWeeklyPremium)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Protected Income */}
            <Card padding="md" className="bg-primary-light border-primary/20">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-primary">Protected Weekly Income</p>
                  <p className="text-[22px] font-bold text-text-primary mt-0.5">{formatCurrency(protectedIncome)}</p>
                  <p className="text-[12px] text-text-secondary mt-1">
                    {tier.coveragePercent}% of ₹{partner.weeklyEarnings.toLocaleString('en-IN')} weekly earnings
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Eligible Disruptions */}
        <Card padding="lg" className="mt-6">
          <CardHeader
            title="Eligible Disruption Triggers"
            subtitle={`${tier.name} tier covers ${tier.eligibleDisruptions.length} disruption types`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tier.eligibleDisruptions.map((dt) => {
              const info = DISRUPTION_TYPE_INFO[dt];
              return (
                <div key={dt} className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-background">
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
              Market analytics events (low demand, rider oversupply, incentive changes) are tracked for risk modelling
              but do not directly trigger payouts.
            </p>
          </div>
        </Card>

        {/* Action */}
        <div className="mt-6 flex justify-end">
          <Link href="/policy">
            <Button>
              Activate Weekly Protection
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </main>
    </>
  );
}

function PremiumLine({
  label,
  value,
  isDiscount,
}: {
  label: string;
  value: number;
  isDiscount?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className={`text-[13px] font-medium ${isDiscount && value < 0 ? 'text-success' : 'text-text-primary'}`}>
        {isDiscount && value < 0 ? '-' : '+'}₹{Math.abs(value)}
      </span>
    </div>
  );
}
