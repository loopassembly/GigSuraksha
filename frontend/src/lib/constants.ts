import {
  BackendEventType,
  BackendShiftType,
  City,
  CoverageTier,
  CoverageTierId,
  DisruptionCategory,
  DisruptionType,
  Platform,
  Severity,
  ShiftWindow,
  Zone,
} from './types';

// ─── Platforms ───────────────────────────────────────────────

export const PLATFORMS: Platform[] = ['Blinkit', 'Zepto', 'Instamart', 'BigBasket Now'];

// ─── Cities ──────────────────────────────────────────────────

export const CITIES: City[] = [
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
];

// ─── Shift Windows ───────────────────────────────────────────

export const SHIFT_WINDOWS: ShiftWindow[] = [
  { id: 'morning', label: 'Morning Rush (7 AM – 11 AM)', startHour: 7, endHour: 11 },
  { id: 'afternoon', label: 'Afternoon (12 PM – 4 PM)', startHour: 12, endHour: 16 },
  { id: 'evening', label: 'Evening Rush (6 PM – 10 PM)', startHour: 18, endHour: 22 },
  { id: 'night', label: 'Late Night (10 PM – 1 AM)', startHour: 22, endHour: 1 },
];

export const SHIFT_TYPE_MAP: Record<string, BackendShiftType> = {
  morning: 'morning_rush',
  afternoon: 'afternoon',
  evening: 'evening_rush',
  night: 'late_night',
};

export const SHIFT_TYPE_LABELS: Record<BackendShiftType, string> = {
  morning_rush: 'Morning Rush',
  afternoon: 'Afternoon',
  evening_rush: 'Evening Rush',
  late_night: 'Late Night',
};

// ─── Zones by City ──────────────────────────────────────────

export const ZONES: Zone[] = [
  { id: 'blr-kora', name: 'Koramangala', city: 'Bengaluru', riskLevel: 'medium', darkStores: ['DS-K1', 'DS-K2', 'DS-K3'], apiSupported: true, backendCity: 'Bengaluru' },
  { id: 'blr-indira', name: 'Indiranagar', city: 'Bengaluru', riskLevel: 'low', darkStores: ['DS-I1', 'DS-I2'], apiSupported: true, backendCity: 'Bengaluru' },
  { id: 'blr-hsr', name: 'HSR Layout', city: 'Bengaluru', riskLevel: 'medium', darkStores: ['DS-H1', 'DS-H2'], apiSupported: true, backendCity: 'Bengaluru' },
  { id: 'blr-whitefield', name: 'Whitefield', city: 'Bengaluru', riskLevel: 'high', darkStores: ['DS-W1', 'DS-W2', 'DS-W3'], apiSupported: true, backendCity: 'Bengaluru' },
  { id: 'blr-jp', name: 'JP Nagar', city: 'Bengaluru', riskLevel: 'low', darkStores: ['DS-JP1'], apiSupported: false },
  { id: 'mum-andheri', name: 'Andheri East', city: 'Mumbai', riskLevel: 'high', darkStores: ['DS-A1', 'DS-A2'], apiSupported: true, backendCity: 'Mumbai' },
  { id: 'mum-bandra', name: 'Bandra West', city: 'Mumbai', riskLevel: 'medium', darkStores: ['DS-B1', 'DS-B2'], apiSupported: true, backendCity: 'Mumbai' },
  { id: 'mum-powai', name: 'Powai', city: 'Mumbai', riskLevel: 'medium', darkStores: ['DS-P1'], apiSupported: true, backendCity: 'Mumbai' },
  { id: 'del-gurgaon', name: 'Gurgaon Sec 49', city: 'Delhi NCR', riskLevel: 'high', darkStores: ['DS-G1', 'DS-G2'], apiSupported: true, backendCity: 'Gurugram' },
  { id: 'del-noida', name: 'Noida Sec 18', city: 'Delhi NCR', riskLevel: 'high', darkStores: ['DS-N1', 'DS-N2'], apiSupported: false },
  { id: 'del-dwarka', name: 'Dwarka', city: 'Delhi NCR', riskLevel: 'medium', darkStores: ['DS-D1'], apiSupported: true, backendCity: 'Delhi' },
  { id: 'hyd-madhapur', name: 'Madhapur', city: 'Hyderabad', riskLevel: 'medium', darkStores: ['DS-M1', 'DS-M2'], apiSupported: false },
  { id: 'hyd-gachi', name: 'Gachibowli', city: 'Hyderabad', riskLevel: 'low', darkStores: ['DS-GA1'], apiSupported: true, backendCity: 'Hyderabad' },
  { id: 'pun-koregaon', name: 'Koregaon Park', city: 'Pune', riskLevel: 'medium', darkStores: ['DS-KP1', 'DS-KP2'], apiSupported: true, backendCity: 'Pune' },
  { id: 'pun-hinjewadi', name: 'Hinjewadi', city: 'Pune', riskLevel: 'low', darkStores: ['DS-HJ1'], apiSupported: false },
  { id: 'chn-anna', name: 'Anna Nagar', city: 'Chennai', riskLevel: 'medium', darkStores: ['DS-AN1', 'DS-AN2'], apiSupported: true, backendCity: 'Chennai' },
  { id: 'chn-adyar', name: 'Adyar', city: 'Chennai', riskLevel: 'high', darkStores: ['DS-AD1'], apiSupported: true, backendCity: 'Chennai' },
];

export const LIVE_ZONES = ZONES.filter((zone) => zone.apiSupported);

// ─── Disruption Taxonomy ─────────────────────────────────────

export const EVENT_TYPE_MAP: Record<DisruptionType, BackendEventType | null> = {
  RAIN_EVENT: 'heavy_rainfall',
  WATERLOGGING_EVENT: 'waterlogging',
  HEAT_STRESS_EVENT: 'heat_stress',
  AIR_QUALITY_EVENT: 'severe_aqi',
  ZONE_ACCESS_RESTRICTION: 'zone_access_restriction',
  DARK_STORE_UNAVAILABLE: 'dark_store_unavailable',
  PLATFORM_OUTAGE: 'platform_outage',
};

export const BACKEND_EVENT_TO_UI_TYPE: Record<BackendEventType, DisruptionType> = {
  heavy_rainfall: 'RAIN_EVENT',
  waterlogging: 'WATERLOGGING_EVENT',
  heat_stress: 'HEAT_STRESS_EVENT',
  severe_aqi: 'AIR_QUALITY_EVENT',
  platform_outage: 'PLATFORM_OUTAGE',
  dark_store_unavailable: 'DARK_STORE_UNAVAILABLE',
  zone_access_restriction: 'ZONE_ACCESS_RESTRICTION',
};

export const DISRUPTION_TYPE_INFO: Record<
  DisruptionType,
  {
    label: string;
    category: DisruptionCategory;
    isPayoutTrigger: boolean;
    description: string;
    icon: string;
  }
> = {
  RAIN_EVENT: {
    label: 'Heavy Rainfall',
    category: 'WEATHER',
    isPayoutTrigger: true,
    description: 'Rainfall exceeding disruption thresholds in a worker’s insured zone',
    icon: 'CloudRain',
  },
  WATERLOGGING_EVENT: {
    label: 'Waterlogging',
    category: 'WEATHER',
    isPayoutTrigger: true,
    description: 'Road inundation preventing last-mile delivery operations',
    icon: 'Waves',
  },
  HEAT_STRESS_EVENT: {
    label: 'Extreme Heat',
    category: 'WEATHER',
    isPayoutTrigger: true,
    description: 'Heat stress severe enough to interrupt delivery work in the insured shift window',
    icon: 'Thermometer',
  },
  AIR_QUALITY_EVENT: {
    label: 'Severe AQI',
    category: 'WEATHER',
    isPayoutTrigger: true,
    description: 'Air quality crossing severe thresholds for rider operations',
    icon: 'Wind',
  },
  ZONE_ACCESS_RESTRICTION: {
    label: 'Zone Access Restricted',
    category: 'ACCESS',
    isPayoutTrigger: true,
    description: 'Municipal or police-imposed access restriction in operating zone',
    icon: 'ShieldOff',
  },
  DARK_STORE_UNAVAILABLE: {
    label: 'Dark Store Down',
    category: 'INFRASTRUCTURE',
    isPayoutTrigger: true,
    description: 'Dark store closure due to infrastructure failure or forced shutdown',
    icon: 'Store',
  },
  PLATFORM_OUTAGE: {
    label: 'Platform Outage',
    category: 'PLATFORM',
    isPayoutTrigger: true,
    description: 'Platform-wide or regional delivery app service unavailability',
    icon: 'WifiOff',
  },
};

export const SEVERITY_CONFIG: Record<Severity, { label: string; multiplier: number; color: string }> = {
  low: { label: 'Low', multiplier: 0.4, color: '#059669' },
  moderate: { label: 'Moderate', multiplier: 0.65, color: '#D97706' },
  high: { label: 'High', multiplier: 0.85, color: '#EA580C' },
  severe: { label: 'Severe', multiplier: 1.0, color: '#DC2626' },
};

// ─── Coverage Tiers ──────────────────────────────────────────

export const COVERAGE_TIERS: CoverageTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    maxWeeklyPayout: 2000,
    coveragePercent: 50,
    eligibleDisruptions: ['RAIN_EVENT', 'WATERLOGGING_EVENT', 'PLATFORM_OUTAGE'],
  },
  {
    id: 'standard',
    name: 'Standard',
    maxWeeklyPayout: 3500,
    coveragePercent: 70,
    eligibleDisruptions: [
      'RAIN_EVENT',
      'WATERLOGGING_EVENT',
      'HEAT_STRESS_EVENT',
      'AIR_QUALITY_EVENT',
      'PLATFORM_OUTAGE',
      'DARK_STORE_UNAVAILABLE',
    ],
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive',
    maxWeeklyPayout: 5000,
    coveragePercent: 90,
    eligibleDisruptions: [
      'RAIN_EVENT',
      'WATERLOGGING_EVENT',
      'HEAT_STRESS_EVENT',
      'AIR_QUALITY_EVENT',
      'ZONE_ACCESS_RESTRICTION',
      'DARK_STORE_UNAVAILABLE',
      'PLATFORM_OUTAGE',
    ],
  },
];

export const COVERAGE_TIER_NAME_MAP: Record<CoverageTierId, string> = {
  basic: 'Basic',
  standard: 'Standard',
  comprehensive: 'Comprehensive',
};

// ─── Risk Parameters ─────────────────────────────────────────

export const ZONE_RISK_LOADINGS: Record<string, number> = {
  low: 3,
  medium: 8,
  high: 14,
};

export const SHIFT_RISK_LOADINGS: Record<string, number> = {
  morning: 3,
  afternoon: 2,
  evening: 5,
  night: 4,
};
