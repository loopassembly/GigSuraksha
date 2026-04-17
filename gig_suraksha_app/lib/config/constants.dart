class ApiConstants {
  static const String baseUrl = 'https://gigsuraksha-backend.fly.dev';

  // endpoints
  static const String health = '/health';
  static const String workerRegister = '/api/workers/register';
  static String workerById(String id) => '/api/workers/$id';
  static const String quoteGenerate = '/api/quote/generate';
  static const String policyCreate = '/api/policies/create';
  static String policyById(String id) => '/api/policies/$id';
  static String policiesForWorker(String wid) => '/api/policies/worker/$wid';
  static const String eventSimulate = '/api/events/simulate';
  static String claimById(String id) => '/api/claims/$id';
  static String claimsForWorker(String wid) => '/api/claims/worker/$wid';
  static const String allClaims = '/api/claims';
  static const String adminSummary = '/api/admin/summary';
  static const String triggerMonitor = '/api/triggers/monitor/run';
  static const String demoQuoteRequests = '/api/demo/quote-requests';
}

class AppStrings {
  static const appName = 'GigSuraksha';
  static const tagline =
      'Income protection for quick-commerce delivery partners';
  static const phase = 'Phase 3 — Flutter';
  static const submissionTag = 'Guidewire DEVTrails 2026';
}

const Map<String, String> kycAngleLabels = {
  'front': 'Front selfie',
  'left': 'Left profile',
  'right': 'Right profile',
};

const Map<String, String> kycAngleHelp = {
  'front':
      'Face the camera directly so the model gets one clean frontal identity frame.',
  'left':
      'Turn slightly left to capture the side profile and block selfie spoofing.',
  'right':
      'Turn slightly right so duplicate-account checks have a third angle.',
};

const List<String> claimEvidenceModes = ['on_site', 'remote_override'];

const Map<String, String> claimEvidenceModeLabels = {
  'on_site': 'Capture the disruption spot',
  'remote_override': 'Cannot safely reach the disruption spot',
};

const List<String> safeOverrideReasons = [
  'Flooded road or waterlogging blocked access',
  'Police barricade, curfew, or access restriction',
  'Unsafe traffic or fallen debris on the route',
  'Zone shut down by platform or store operations',
];

// ─── Supported Platforms ──────────────────────────────────────
const List<String> supportedPlatforms = [
  'Blinkit',
  'Zepto',
  'Instamart',
  'BigBasket Now',
];

// ─── Supported Cities ─────────────────────────────────────────
const List<String> supportedCities = [
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
];

// ─── Zone definitions ─────────────────────────────────────────
class ZoneInfo {
  final String id;
  final String name;
  final String city;
  final String riskLevel;
  final bool apiSupported;
  final String? backendCity;
  final String? backendName;

  const ZoneInfo({
    required this.id,
    required this.name,
    required this.city,
    required this.riskLevel,
    this.apiSupported = false,
    this.backendCity,
    this.backendName,
  });
}

const List<ZoneInfo> allZones = [
  ZoneInfo(
    id: 'blr-kora',
    name: 'Koramangala',
    city: 'Bengaluru',
    riskLevel: 'medium',
    apiSupported: true,
    backendCity: 'Bengaluru',
  ),
  ZoneInfo(
    id: 'blr-indira',
    name: 'Indiranagar',
    city: 'Bengaluru',
    riskLevel: 'low',
    apiSupported: true,
    backendCity: 'Bengaluru',
  ),
  ZoneInfo(
    id: 'blr-hsr',
    name: 'HSR Layout',
    city: 'Bengaluru',
    riskLevel: 'medium',
    apiSupported: true,
    backendCity: 'Bengaluru',
  ),
  ZoneInfo(
    id: 'blr-whitefield',
    name: 'Whitefield',
    city: 'Bengaluru',
    riskLevel: 'high',
    apiSupported: true,
    backendCity: 'Bengaluru',
  ),
  ZoneInfo(
    id: 'blr-jp',
    name: 'JP Nagar',
    city: 'Bengaluru',
    riskLevel: 'low',
    apiSupported: false,
  ),
  ZoneInfo(
    id: 'mum-andheri',
    name: 'Andheri East',
    city: 'Mumbai',
    riskLevel: 'high',
    apiSupported: true,
    backendCity: 'Mumbai',
  ),
  ZoneInfo(
    id: 'mum-bandra',
    name: 'Bandra West',
    city: 'Mumbai',
    riskLevel: 'medium',
    apiSupported: true,
    backendCity: 'Mumbai',
  ),
  ZoneInfo(
    id: 'mum-powai',
    name: 'Powai',
    city: 'Mumbai',
    riskLevel: 'medium',
    apiSupported: true,
    backendCity: 'Mumbai',
  ),
  ZoneInfo(
    id: 'del-gurgaon',
    name: 'Gurgaon Sec 49',
    city: 'Delhi NCR',
    riskLevel: 'high',
    apiSupported: true,
    backendCity: 'Gurugram',
  ),
  ZoneInfo(
    id: 'del-noida',
    name: 'Noida Sec 18',
    city: 'Delhi NCR',
    riskLevel: 'high',
    apiSupported: false,
  ),
  ZoneInfo(
    id: 'del-dwarka',
    name: 'Dwarka',
    city: 'Delhi NCR',
    riskLevel: 'medium',
    apiSupported: true,
    backendCity: 'Delhi',
  ),
  ZoneInfo(
    id: 'hyd-madhapur',
    name: 'Madhapur',
    city: 'Hyderabad',
    riskLevel: 'medium',
    apiSupported: false,
  ),
  ZoneInfo(
    id: 'hyd-gachi',
    name: 'Gachibowli',
    city: 'Hyderabad',
    riskLevel: 'low',
    apiSupported: true,
    backendCity: 'Hyderabad',
  ),
  ZoneInfo(
    id: 'pun-koregaon',
    name: 'Koregaon Park',
    city: 'Pune',
    riskLevel: 'medium',
    apiSupported: true,
    backendCity: 'Pune',
  ),
  ZoneInfo(
    id: 'pun-hinjewadi',
    name: 'Hinjewadi',
    city: 'Pune',
    riskLevel: 'low',
    apiSupported: false,
  ),
  ZoneInfo(
    id: 'chn-anna',
    name: 'Anna Nagar',
    city: 'Chennai',
    riskLevel: 'medium',
    apiSupported: true,
    backendCity: 'Chennai',
  ),
  ZoneInfo(
    id: 'chn-adyar',
    name: 'Adyar',
    city: 'Chennai',
    riskLevel: 'high',
    apiSupported: true,
    backendCity: 'Chennai',
  ),
];

List<ZoneInfo> zonesForCity(String city) =>
    allZones.where((z) => z.city == city && z.apiSupported).toList();

// ─── Shift Windows ────────────────────────────────────────────
class ShiftInfo {
  final String id;
  final String label;
  final String backendType;
  final int startHour;
  final int endHour;

  const ShiftInfo({
    required this.id,
    required this.label,
    required this.backendType,
    required this.startHour,
    required this.endHour,
  });
}

const List<ShiftInfo> shiftWindows = [
  ShiftInfo(
    id: 'morning',
    label: 'Morning Rush (7 AM – 11 AM)',
    backendType: 'morning_rush',
    startHour: 7,
    endHour: 11,
  ),
  ShiftInfo(
    id: 'afternoon',
    label: 'Afternoon (12 PM – 4 PM)',
    backendType: 'afternoon',
    startHour: 12,
    endHour: 16,
  ),
  ShiftInfo(
    id: 'evening',
    label: 'Evening Rush (6 PM – 10 PM)',
    backendType: 'evening_rush',
    startHour: 18,
    endHour: 22,
  ),
  ShiftInfo(
    id: 'night',
    label: 'Late Night (10 PM – 1 AM)',
    backendType: 'late_night',
    startHour: 22,
    endHour: 1,
  ),
];

// ─── Coverage Tiers ───────────────────────────────────────────
class CoverageTierInfo {
  final String id;
  final String name;
  final int maxWeeklyPayout;
  final int coveragePercent;
  final String description;

  const CoverageTierInfo({
    required this.id,
    required this.name,
    required this.maxWeeklyPayout,
    required this.coveragePercent,
    required this.description,
  });
}

const List<CoverageTierInfo> coverageTiers = [
  CoverageTierInfo(
    id: 'basic',
    name: 'Basic',
    maxWeeklyPayout: 2000,
    coveragePercent: 50,
    description: 'Rain, waterlogging, platform outage',
  ),
  CoverageTierInfo(
    id: 'standard',
    name: 'Standard',
    maxWeeklyPayout: 3500,
    coveragePercent: 70,
    description: 'Weather + platform + dark store events',
  ),
  CoverageTierInfo(
    id: 'comprehensive',
    name: 'Comprehensive',
    maxWeeklyPayout: 5000,
    coveragePercent: 90,
    description: 'All disruption types covered',
  ),
];

// ─── Event Type Labels ────────────────────────────────────────
const Map<String, String> eventTypeLabels = {
  'heavy_rainfall': 'Heavy Rainfall',
  'waterlogging': 'Waterlogging',
  'heat_stress': 'Extreme Heat',
  'severe_aqi': 'Severe AQI',
  'platform_outage': 'Platform Outage',
  'dark_store_unavailable': 'Dark Store Down',
  'zone_access_restriction': 'Zone Restricted',
};

// ─── Severity Config ──────────────────────────────────────────
const Map<String, double> severityMultipliers = {
  'low': 0.4,
  'moderate': 0.65,
  'high': 0.85,
  'severe': 1.0,
};

const List<String> severityLevels = ['low', 'moderate', 'high', 'severe'];

const List<String> eventTypes = [
  'heavy_rainfall',
  'waterlogging',
  'heat_stress',
  'severe_aqi',
  'platform_outage',
  'dark_store_unavailable',
  'zone_access_restriction',
];

// ─── Shift type label map ─────────────────────────────────────
const Map<String, String> shiftTypeLabels = {
  'morning_rush': 'Morning Rush',
  'afternoon': 'Afternoon',
  'evening_rush': 'Evening Rush',
  'late_night': 'Late Night',
};

// ─── Coverage tier label map ──────────────────────────────────
const Map<String, String> coverageTierLabels = {
  'basic': 'Basic',
  'standard': 'Standard',
  'comprehensive': 'Comprehensive',
};
