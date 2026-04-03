// ─── Enums & Constants ───────────────────────────────────────

export type Platform = 'Blinkit' | 'Zepto' | 'Instamart' | 'BigBasket Now';

export type City = 'Bengaluru' | 'Mumbai' | 'Delhi NCR' | 'Hyderabad' | 'Pune' | 'Chennai';

export type CoverageTierId = 'basic' | 'standard' | 'comprehensive';
export type BackendShiftType = 'morning_rush' | 'afternoon' | 'evening_rush' | 'late_night';
export type BackendRiskBand = 'LOW' | 'MEDIUM' | 'HIGH';
export type BackendClaimStatus = 'auto_initiated' | 'approved' | 'rejected';
export type BackendPolicyStatus = 'active' | 'expired' | 'cancelled';
export type BackendPayoutStatus = 'pending' | 'processed' | 'failed';
export type BackendEventType =
  | 'heavy_rainfall'
  | 'waterlogging'
  | 'heat_stress'
  | 'severe_aqi'
  | 'platform_outage'
  | 'dark_store_unavailable'
  | 'zone_access_restriction';

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
  apiSupported?: boolean;
  backendCity?: string;
  backendName?: string;
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
  score: number;
  color: string;
}

export interface RiskProfile {
  overall: number;
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
  id: CoverageTierId;
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

// ─── Backend Contracts ───────────────────────────────────────

export interface BackendWorker {
  worker_id: string;
  name: string;
  phone: string;
  city: string;
  platform: string;
  zone: string;
  shift_type: BackendShiftType;
  weekly_earnings: number;
  weekly_active_hours: number;
  upi_id: string;
  created_at: string;
  updated_at: string;
}

export interface BackendRiskSummary {
  risk_score: number;
  risk_band: BackendRiskBand;
  expected_disrupted_hours: number;
  premium_loading: number;
  top_risk_drivers: string[];
  zone_risk_band: BackendRiskBand;
  zone_baseline_risk_score: number;
}

export interface BackendPremiumBreakdown {
  base_premium: number;
  zone_risk_loading: number;
  shift_exposure_loading: number;
  coverage_factor: number;
  ml_risk_loading: number;
  safe_zone_discount: number;
  final_weekly_premium: number;
}

export interface BackendCoverageSummary {
  coverage_tier: CoverageTierId;
  coverage_percent: number;
  max_weekly_payout: number;
  insured_shift_hours_per_week: number;
  protected_hours_basis: number;
  protected_weekly_income: number;
  protected_hourly_income: number;
}

export interface BackendQuoteResponse {
  model_version: string;
  worker_profile: {
    city: string;
    zone: string;
    shift_type: BackendShiftType;
    coverage_tier: CoverageTierId;
    weekly_earnings: number;
    weekly_active_hours: number;
  };
  risk_summary: BackendRiskSummary;
  premium_breakdown: BackendPremiumBreakdown;
  coverage_summary: BackendCoverageSummary;
}

export interface BackendPolicy {
  policy_id: string;
  worker_id: string;
  city: string;
  zone: string;
  shift_type: BackendShiftType;
  coverage_tier: CoverageTierId;
  weekly_earnings: number;
  weekly_active_hours: number;
  model_version: string;
  risk_summary: BackendRiskSummary;
  premium_breakdown: BackendPremiumBreakdown;
  coverage_summary: BackendCoverageSummary;
  weekly_premium: number;
  max_weekly_payout: number;
  coverage_percent: number;
  valid_from: string;
  valid_to: string;
  status: BackendPolicyStatus;
  created_at: string;
  updated_at: string;
}

export interface BackendEvent {
  event_id: string;
  event_type: string;
  city: string;
  zone: string;
  severity: Severity;
  start_time: string;
  duration_hours: number;
  end_time: string;
  source: string;
  verified: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BackendClaim {
  claim_id: string;
  worker_id: string;
  policy_id: string;
  event_id: string;
  city: string;
  zone: string;
  event_type: string;
  severity: Severity;
  affected_hours: number;
  protected_hourly_income: number;
  severity_multiplier: number;
  payout_estimate: number;
  status: BackendClaimStatus;
  validation_checks: Record<string, boolean>;
  anomaly_score: number;
  anomaly_band: BackendRiskBand;
  anomaly_reasons: string[];
  activity_snapshot: Record<string, unknown>;
  payout_status: BackendPayoutStatus;
  payout_channel: string | null;
  payout_reference: string | null;
  payout_processed_at: string | null;
  payout_amount: number;
  payout_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BackendClaimsResponse {
  claims: BackendClaim[];
}

export interface BackendPoliciesResponse {
  policies: BackendPolicy[];
}

export interface BackendEventSimulationResponse {
  event: BackendEvent;
  claims_created: number;
  claims: BackendClaim[];
}

export interface TriggerMonitorRunResponse {
  monitor_run_id: string;
  reference_time: string;
  dry_run: boolean;
  sources_used: string[];
  policies_scanned: number;
  candidate_events: Array<{
    event_type: string;
    city: string;
    zone: string;
    severity: Severity;
    start_time: string;
    duration_hours: number;
    source: string;
    metadata: Record<string, unknown>;
  }>;
  events_created: number;
  claims_created: number;
  events: BackendEvent[];
}

export interface AdminSummary {
  total_workers: number;
  total_active_policies: number;
  total_events: number;
  total_claims: number;
  claims_by_status: Record<string, number>;
  claims_by_event_type: Record<string, number>;
  recent_events: BackendEvent[];
  recent_claims: BackendClaim[];
  forecast_cards: Array<{
    city: string;
    zone: string;
    shift_type: BackendShiftType;
    coverage_tier: CoverageTierId;
    risk_band: BackendRiskBand;
    risk_score: number;
    expected_disrupted_hours: number;
    suggested_weekly_premium: number;
    model_version: string;
  }>;
}

// ─── Local Session Types ─────────────────────────────────────

export interface StoredWorker {
  worker_id: string;
  name: string;
  phone: string;
  display_city: City | string;
  backend_city: string;
  platform: Platform | string;
  zone_id: string;
  zone: string;
  shift_ids: string[];
  shift_type: BackendShiftType;
  weekly_earnings: number;
  weekly_active_hours: number;
  upi_id: string;
  created_at: string;
  updated_at: string;
}

export interface StoredEvent {
  event: BackendEvent;
  claims_created: number;
  claims: BackendClaim[];
}

export interface ApiErrorShape {
  detail?: unknown;
  message?: string;
}
