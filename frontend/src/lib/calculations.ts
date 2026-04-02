import { SEVERITY_CONFIG, SHIFT_RISK_LOADINGS, ZONE_RISK_LOADINGS } from './constants';
import type { PremiumBreakdown, RiskProfile, Severity, Zone, ShiftWindow } from './types';

// ─── Risk Scoring ────────────────────────────────────────────

export function calculateRiskProfile(
  zone: Zone,
  shifts: ShiftWindow[],
  city: string
): RiskProfile {
  const zoneScore = zone.riskLevel === 'high' ? 78 : zone.riskLevel === 'medium' ? 52 : 28;

  // Simulated risk factors based on city/zone
  const rainfallScore = getWeatherRisk(city, 'rain');
  const waterloggingScore = zone.riskLevel === 'high' ? 68 : zone.riskLevel === 'medium' ? 42 : 18;
  const aqiScore = getWeatherRisk(city, 'aqi');
  const heatScore = getWeatherRisk(city, 'heat');
  const shiftScore = shifts.reduce((max, s) => {
    const score = s.id === 'evening' ? 72 : s.id === 'night' ? 65 : s.id === 'morning' ? 55 : 35;
    return Math.max(max, score);
  }, 0);

  const factors = [
    { label: 'Zone Risk', score: zoneScore, color: '#2563EB' },
    { label: 'Rainfall Exposure', score: rainfallScore, color: '#0891B2' },
    { label: 'Waterlogging Risk', score: waterloggingScore, color: '#7C3AED' },
    { label: 'AQI Exposure', score: aqiScore, color: '#D97706' },
    { label: 'Heat Risk', score: heatScore, color: '#DC2626' },
    { label: 'Shift Timing', score: shiftScore, color: '#059669' },
  ];

  const overall = Math.round(factors.reduce((sum, f) => sum + f.score, 0) / factors.length);
  const tier = overall >= 60 ? 'high' : overall >= 40 ? 'moderate' : 'low';

  return { overall, factors, tier };
}

function getWeatherRisk(city: string, type: 'rain' | 'aqi' | 'heat'): number {
  const risks: Record<string, Record<string, number>> = {
    'Bengaluru': { rain: 62, aqi: 30, heat: 38 },
    'Mumbai': { rain: 85, aqi: 45, heat: 42 },
    'Delhi NCR': { rain: 55, aqi: 82, heat: 75 },
    'Hyderabad': { rain: 48, aqi: 38, heat: 68 },
    'Pune': { rain: 58, aqi: 35, heat: 45 },
    'Chennai': { rain: 72, aqi: 32, heat: 70 },
  };
  return risks[city]?.[type] ?? 40;
}

// ─── Premium Calculation ─────────────────────────────────────

export function calculatePremium(
  zone: Zone,
  shifts: ShiftWindow[],
  weeklyEarnings: number,
  coveragePercent: number
): PremiumBreakdown {
  const basePremium = 29;
  const zoneRiskLoading = ZONE_RISK_LOADINGS[zone.riskLevel] || 8;

  const shiftExposureLoading = shifts.reduce((sum, s) => {
    return sum + (SHIFT_RISK_LOADINGS[s.id] || 3);
  }, 0);

  // Coverage factor scales with earnings and coverage percentage
  const coverageFactor = Math.round((weeklyEarnings * coveragePercent) / 100 / 1000) + 3;

  // Safe zone discount for low-risk zones
  const safeZoneDiscount = zone.riskLevel === 'low' ? 5 : zone.riskLevel === 'medium' ? 3 : 0;

  const finalWeeklyPremium =
    basePremium + zoneRiskLoading + shiftExposureLoading + coverageFactor - safeZoneDiscount;

  return {
    basePremium,
    zoneRiskLoading,
    shiftExposureLoading,
    coverageFactor,
    safeZoneDiscount,
    finalWeeklyPremium: Math.max(finalWeeklyPremium, 15),
  };
}

// ─── Payout Calculation ──────────────────────────────────────

export function calculatePayout(
  protectedHourlyIncome: number,
  affectedHours: number,
  severity: Severity,
  weeklyCapRemaining: number
): number {
  const multiplier = SEVERITY_CONFIG[severity].multiplier;
  const rawPayout = protectedHourlyIncome * affectedHours * multiplier;
  return Math.min(Math.round(rawPayout), weeklyCapRemaining);
}

// ─── Shift Overlap ───────────────────────────────────────────

export function calculateShiftOverlap(
  eventStartHour: number,
  eventDurationHours: number,
  shifts: ShiftWindow[]
): number {
  const eventEnd = eventStartHour + eventDurationHours;
  let totalOverlap = 0;

  for (const shift of shifts) {
    const shiftEnd = shift.endHour < shift.startHour ? shift.endHour + 24 : shift.endHour;
    const overlapStart = Math.max(eventStartHour, shift.startHour);
    const overlapEnd = Math.min(eventEnd, shiftEnd);
    if (overlapEnd > overlapStart) {
      totalOverlap += overlapEnd - overlapStart;
    }
  }

  return Math.round(totalOverlap * 10) / 10;
}

// ─── Formatting Helpers ──────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}
