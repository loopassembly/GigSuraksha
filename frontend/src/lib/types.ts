// ─── Enums & Constants ───────────────────────────────────────

export type Platform = 'Blinkit' | 'Zepto' | 'Instamart' | 'BigBasket Now';

export type City = 'Bengaluru' | 'Mumbai' | 'Delhi NCR' | 'Hyderabad' | 'Pune' | 'Chennai';

export type DisruptionCategory =
  | 'WEATHER'
  | 'ACCESS'
  | 'PLATFORM'
  | 'INFRASTRUCTURE'
  | 'MOBILITY'
  | 'REGULATORY'
  | 'MARKET_ANALYTICS';

export type DisruptionType =
  | 'RAIN_EVENT'
  | 'WATERLOGGING_EVENT'
  | 'HEAT_STRESS_EVENT'
  | 'AIR_QUALITY_EVENT'
  | 'ZONE_ACCESS_RESTRICTION'
  | 'DARK_STORE_UNAVAILABLE'
  | 'PLATFORM_OUTAGE';

export type Severity = 'low' | 'moderate' | 'high' | 'severe';

export type ClaimStatus = 'eligible' | 'processing' | 'approved' | 'rejected' | 'paid';

export type PolicyStatus = 'active' | 'expired' | 'pending' | 'cancelled';

// ─── Core Interfaces ─────────────────────────────────────────

export interface ShiftWindow {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
}

export interface Zone {
  id: string;
  name: string;
  city: City;
  riskLevel: 'low' | 'medium' | 'high';
  darkStores: string[];
}

export interface DeliveryPartner {
  id: string;
  name: string;
  mobile: string;
  city: City;
  platform: Platform;
  zone: Zone;
  shifts: ShiftWindow[];
  weeklyEarnings: number;
  weeklyActiveHours: number;
  upiId: string;
}

export interface RiskFactor {
  label: string;
  score: number; // 0-100
  color: string;
}

export interface RiskProfile {
  overall: number; // 0-100
  factors: RiskFactor[];
  tier: 'low' | 'moderate' | 'high';
}

export interface PremiumBreakdown {
  basePremium: number;
  zoneRiskLoading: number;
  shiftExposureLoading: number;
  coverageFactor: number;
  safeZoneDiscount: number;
  finalWeeklyPremium: number;
}

export interface CoverageTier {
  id: string;
  name: string;
  maxWeeklyPayout: number;
  coveragePercent: number;
  eligibleDisruptions: DisruptionType[];
}

export interface Policy {
  id: string;
  partnerId: string;
  partnerName: string;
  weekLabel: string;
  startDate: string;
  endDate: string;
  status: PolicyStatus;
  zone: Zone;
  shifts: ShiftWindow[];
  premium: PremiumBreakdown;
  coverageTier: CoverageTier;
  protectedWeeklyIncome: number;
  protectedHourlyIncome: number;
}

export interface DisruptionEvent {
  id: string;
  type: DisruptionType;
  category: DisruptionCategory;
  severity: Severity;
  city: City;
  zone: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  description: string;
  isPayoutTrigger: boolean;
  dataSource: string;
}

export interface ValidationCheck {
  id: string;
  label: string;
  description: string;
  passed: boolean;
}

export interface ClaimPreview {
  id: string;
  policyId: string;
  event: DisruptionEvent;
  protectedHourlyIncome: number;
  affectedHours: number;
  severityMultiplier: number;
  weeklyCapRemaining: number;
  estimatedPayout: number;
  validationChecks: ValidationCheck[];
  status: ClaimStatus;
  shiftOverlapHours: number;
}

export interface ClaimRecord {
  id: string;
  date: string;
  disruptionType: DisruptionType;
  amount: number;
  status: ClaimStatus;
  affectedHours: number;
}

// ─── Admin Interfaces ────────────────────────────────────────

export interface AdminStats {
  activePolicies: number;
  activePoliciesChange: number;
  totalClaims: number;
  totalClaimsChange: number;
  totalPayouts: number;
  totalPayoutsChange: number;
  lossRatio: number;
  lossRatioChange: number;
}

export interface ClaimsByType {
  type: string;
  count: number;
  amount: number;
}

export interface ZoneExposure {
  zone: string;
  city: City;
  activePolicies: number;
  riskLevel: string;
  totalExposure: number;
}

export interface AnomalyAlert {
  id: string;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  zone: string;
}

export interface ForecastInsight {
  zone: string;
  city: City;
  riskType: DisruptionType;
  probability: number;
  expectedImpact: string;
  week: string;
}

// ─── Onboarding ──────────────────────────────────────────────

export interface OnboardingData {
  name: string;
  mobile: string;
  city: City | '';
  platform: Platform | '';
  zoneId: string;
  shifts: string[];
  weeklyEarnings: number;
  weeklyActiveHours: number;
  upiId: string;
}
