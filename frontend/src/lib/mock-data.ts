import type {
  AdminStats,
  AnomalyAlert,
  ClaimRecord,
  ClaimsByType,
  DisruptionEvent,
  ForecastInsight,
  Policy,
  ZoneExposure,
} from './types';
import { COVERAGE_TIERS, ZONES } from './constants';

// ─── Sample Delivery Partner (Ravi) ──────────────────────────

export const SAMPLE_PARTNER = {
  id: 'DP-001',
  name: 'Ravi Kumar',
  mobile: '+91 98765 43210',
  city: 'Bengaluru' as const,
  platform: 'Blinkit' as const,
  zone: ZONES.find((z) => z.id === 'blr-kora')!,
  shifts: [
    { id: 'morning', label: 'Morning Rush (7 AM – 11 AM)', startHour: 7, endHour: 11 },
    { id: 'evening', label: 'Evening Rush (6 PM – 10 PM)', startHour: 18, endHour: 22 },
  ],
  weeklyEarnings: 6000,
  weeklyActiveHours: 40,
  upiId: 'ravi.kumar@upi',
};

// ─── Sample Policy ───────────────────────────────────────────

export const SAMPLE_POLICY: Policy = {
  id: 'POL-2026-W12-001',
  partnerId: 'DP-001',
  partnerName: 'Ravi Kumar',
  weekLabel: 'Week 12 (Mar 16 – Mar 22, 2026)',
  startDate: '2026-03-16',
  endDate: '2026-03-22',
  status: 'active',
  zone: ZONES.find((z) => z.id === 'blr-kora')!,
  shifts: SAMPLE_PARTNER.shifts,
  premium: {
    basePremium: 29,
    zoneRiskLoading: 8,
    shiftExposureLoading: 8,
    coverageFactor: 7,
    safeZoneDiscount: 3,
    finalWeeklyPremium: 49,
  },
  coverageTier: COVERAGE_TIERS[1], // Standard
  protectedWeeklyIncome: 4200,
  protectedHourlyIncome: 150,
};

// ─── Sample Disruption Events ────────────────────────────────

export const SAMPLE_DISRUPTIONS: DisruptionEvent[] = [
  {
    id: 'EVT-001',
    type: 'RAIN_EVENT',
    category: 'WEATHER',
    severity: 'high',
    city: 'Bengaluru',
    zone: 'Koramangala',
    startTime: '2026-03-18T18:30:00',
    endTime: '2026-03-18T21:30:00',
    durationHours: 3,
    description: 'Heavy rainfall (78mm/hr) causing delivery disruptions across Koramangala cluster',
    isPayoutTrigger: true,
    dataSource: 'IMD Automatic Weather Station',
  },
  {
    id: 'EVT-002',
    type: 'WATERLOGGING_EVENT',
    category: 'WEATHER',
    severity: 'moderate',
    city: 'Mumbai',
    zone: 'Andheri East',
    startTime: '2026-03-17T14:00:00',
    endTime: '2026-03-17T18:00:00',
    durationHours: 4,
    description: 'Road waterlogging on SV Road and Link Road affecting 3 dark store clusters',
    isPayoutTrigger: true,
    dataSource: 'BMC Flood Monitoring + Satellite',
  },
  {
    id: 'EVT-003',
    type: 'AIR_QUALITY_EVENT',
    category: 'WEATHER',
    severity: 'severe',
    city: 'Delhi NCR',
    zone: 'Gurgaon Sec 49',
    startTime: '2026-03-15T06:00:00',
    endTime: '2026-03-15T14:00:00',
    durationHours: 8,
    description: 'AQI crossed 450 in Gurgaon. GRAP Stage IV restrictions in effect.',
    isPayoutTrigger: true,
    dataSource: 'CPCB Real-Time AQI Monitoring',
  },
  {
    id: 'EVT-004',
    type: 'PLATFORM_OUTAGE',
    category: 'PLATFORM',
    severity: 'moderate',
    city: 'Bengaluru',
    zone: 'HSR Layout',
    startTime: '2026-03-19T19:00:00',
    endTime: '2026-03-19T20:30:00',
    durationHours: 1.5,
    description: 'Blinkit regional outage affecting order dispatch in South Bengaluru',
    isPayoutTrigger: true,
    dataSource: 'Platform Status API + DownDetector',
  },
  {
    id: 'EVT-005',
    type: 'HEAT_STRESS_EVENT',
    category: 'WEATHER',
    severity: 'high',
    city: 'Chennai',
    zone: 'Anna Nagar',
    startTime: '2026-03-20T11:00:00',
    endTime: '2026-03-20T16:00:00',
    durationHours: 5,
    description: 'Temperature at 44°C with heat index exceeding safe threshold',
    isPayoutTrigger: true,
    dataSource: 'IMD Heat Wave Alert',
  },
];

// ─── Sample Claim History ────────────────────────────────────

export const SAMPLE_CLAIMS: ClaimRecord[] = [
  {
    id: 'CLM-001',
    date: '2026-03-18',
    disruptionType: 'RAIN_EVENT',
    amount: 382,
    status: 'paid',
    affectedHours: 3,
  },
  {
    id: 'CLM-002',
    date: '2026-03-12',
    disruptionType: 'PLATFORM_OUTAGE',
    amount: 195,
    status: 'paid',
    affectedHours: 2,
  },
  {
    id: 'CLM-003',
    date: '2026-03-05',
    disruptionType: 'WATERLOGGING_EVENT',
    amount: 290,
    status: 'paid',
    affectedHours: 3,
  },
  {
    id: 'CLM-004',
    date: '2026-03-19',
    disruptionType: 'RAIN_EVENT',
    amount: 255,
    status: 'processing',
    affectedHours: 2,
  },
];

// ─── Admin Dashboard Data ────────────────────────────────────

export const ADMIN_STATS: AdminStats = {
  activePolicies: 12847,
  activePoliciesChange: 8.2,
  totalClaims: 1893,
  totalClaimsChange: 14.5,
  totalPayouts: 847620,
  totalPayoutsChange: 11.3,
  lossRatio: 0.62,
  lossRatioChange: -2.1,
};

export const CLAIMS_BY_TYPE: ClaimsByType[] = [
  { type: 'Heavy Rainfall', count: 642, amount: 298450 },
  { type: 'Waterlogging', count: 389, amount: 178230 },
  { type: 'Platform Outage', count: 312, amount: 142980 },
  { type: 'Severe AQI', count: 248, amount: 112540 },
  { type: 'Extreme Heat', count: 187, amount: 72840 },
  { type: 'Dark Store Down', count: 78, amount: 28940 },
  { type: 'Zone Restriction', count: 37, amount: 13640 },
];

export const ZONE_EXPOSURE: ZoneExposure[] = [
  { zone: 'Koramangala', city: 'Bengaluru', activePolicies: 1842, riskLevel: 'Medium', totalExposure: 6447000 },
  { zone: 'Andheri East', city: 'Mumbai', activePolicies: 2156, riskLevel: 'High', totalExposure: 8624000 },
  { zone: 'Gurgaon Sec 49', city: 'Delhi NCR', activePolicies: 1634, riskLevel: 'High', totalExposure: 6536000 },
  { zone: 'Madhapur', city: 'Hyderabad', activePolicies: 1248, riskLevel: 'Medium', totalExposure: 4368000 },
  { zone: 'Anna Nagar', city: 'Chennai', activePolicies: 1095, riskLevel: 'Medium', totalExposure: 3832500 },
  { zone: 'Indiranagar', city: 'Bengaluru', activePolicies: 987, riskLevel: 'Low', totalExposure: 3453000 },
  { zone: 'Bandra West', city: 'Mumbai', activePolicies: 1423, riskLevel: 'Medium', totalExposure: 4980500 },
  { zone: 'Noida Sec 18', city: 'Delhi NCR', activePolicies: 1462, riskLevel: 'High', totalExposure: 5848000 },
];

export const ANOMALY_ALERTS: AnomalyAlert[] = [
  {
    id: 'ANM-001',
    type: 'Duplicate Claims',
    severity: 'critical',
    message: '3 claims from same zone within 15 min window — potential coordination',
    timestamp: '2026-03-20T09:15:00',
    zone: 'Andheri East',
  },
  {
    id: 'ANM-002',
    type: 'Earnings Mismatch',
    severity: 'warning',
    message: 'Declared earnings 40% above zone median for 12 policies in Gurgaon cluster',
    timestamp: '2026-03-19T22:30:00',
    zone: 'Gurgaon Sec 49',
  },
  {
    id: 'ANM-003',
    type: 'Event Validation',
    severity: 'warning',
    message: 'Rain event claim filed but IMD station shows <10mm rainfall in Powai',
    timestamp: '2026-03-19T18:45:00',
    zone: 'Powai',
  },
  {
    id: 'ANM-004',
    type: 'Shift Anomaly',
    severity: 'warning',
    message: 'Rider claims disruption during shift window but GPS shows activity outside zone',
    timestamp: '2026-03-18T21:00:00',
    zone: 'HSR Layout',
  },
];

export const FORECAST_INSIGHTS: ForecastInsight[] = [
  {
    zone: 'Koramangala',
    city: 'Bengaluru',
    riskType: 'RAIN_EVENT',
    probability: 0.72,
    expectedImpact: '₹38K–₹52K payout exposure',
    week: 'Week 13 (Mar 23–29)',
  },
  {
    zone: 'Andheri East',
    city: 'Mumbai',
    riskType: 'WATERLOGGING_EVENT',
    probability: 0.58,
    expectedImpact: '₹25K–₹41K payout exposure',
    week: 'Week 13 (Mar 23–29)',
  },
  {
    zone: 'Gurgaon Sec 49',
    city: 'Delhi NCR',
    riskType: 'AIR_QUALITY_EVENT',
    probability: 0.65,
    expectedImpact: '₹18K–₹29K payout exposure',
    week: 'Week 13 (Mar 23–29)',
  },
  {
    zone: 'Anna Nagar',
    city: 'Chennai',
    riskType: 'HEAT_STRESS_EVENT',
    probability: 0.81,
    expectedImpact: '₹14K–₹22K payout exposure',
    week: 'Week 13 (Mar 23–29)',
  },
];
