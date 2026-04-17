import 'package:flutter/foundation.dart';

import '../services/telemetry_service.dart';
import '../services/verification_service.dart';

class VerificationProvider extends ChangeNotifier {
  VerificationProvider(this._service, this._telemetry) {
    _kycProfile = _service.getKycProfile();
    _claimEvidenceById = Map<String, dynamic>.from(
      _service.getClaimEvidenceMap(),
    );
  }

  final VerificationService _service;
  final TelemetryService _telemetry;

  Map<String, dynamic>? _kycProfile;
  Map<String, dynamic> _claimEvidenceById = {};
  bool _busy = false;
  String? _errorMessage;

  Map<String, dynamic>? get kycProfile => _kycProfile;
  bool get busy => _busy;
  String? get error => _errorMessage;
  bool get isKycVerified => (_kycProfile?['status'] as String?) == 'verified';
  int get capturedKycAngles =>
      (_kycProfile?['angles'] as Map<String, dynamic>? ?? {}).length;
  int get claimEvidenceCount => _claimEvidenceById.length;

  Map<String, dynamic>? evidenceForClaim(String claimId) {
    final evidence = _claimEvidenceById[claimId];
    return evidence is Map ? Map<String, dynamic>.from(evidence) : null;
  }

  Future<Map<String, dynamic>?> captureKycAngle({required String angle}) async {
    return _capturePhoto(category: 'kyc_$angle', useFrontCamera: true);
  }

  Future<Map<String, dynamic>?> captureClaimEvidencePhoto({
    required String mode,
  }) async {
    return _capturePhoto(
      category: mode == 'remote_override'
          ? 'claim_safe_override'
          : 'claim_scene',
    );
  }

  Future<void> saveKycProfile({
    required String workerId,
    required String workerName,
    required String phone,
    required String city,
    required String zone,
    required Map<String, dynamic> frontAngle,
    required Map<String, dynamic> leftAngle,
    required Map<String, dynamic> rightAngle,
  }) async {
    final now = DateTime.now().toIso8601String();
    final profile = <String, dynamic>{
      'worker_id': workerId,
      'worker_name': workerName,
      'phone': phone,
      'city': city,
      'zone': zone,
      'status': 'verified',
      'verified_at': now,
      'verification_mode': 'three_angle_selfie',
      'integrity_score': 0.96,
      'ml_readiness': 'ready_for_face_match',
      'angles': {'front': frontAngle, 'left': leftAngle, 'right': rightAngle},
      'checks': {
        'three_angles_captured': true,
        'captured_in_same_session': true,
        'recent_capture': true,
      },
    };

    _kycProfile = profile;
    await _service.saveKycProfile(profile);
    await _telemetry.logKycCompleted(city: city, captureCount: 3);
    notifyListeners();
  }

  Future<Map<String, dynamic>> attachEvidenceToClaims({
    required List<String> claimIds,
    required String workerId,
    required String eventType,
    required String zone,
    required String city,
    required String mode,
    required Map<String, dynamic> photo,
    required Map<String, dynamic>? locationSnapshot,
    String? reason,
    String? notes,
  }) async {
    final isSafeOverride = mode == 'remote_override';
    final kycVerified = isKycVerified;
    final gpsAttached = locationSnapshot != null;
    final trustScore = _computeTrustScore(
      kycVerified: kycVerified,
      gpsAttached: gpsAttached,
      isSafeOverride: isSafeOverride,
      hasNotes: notes != null && notes.trim().isNotEmpty,
    );

    final packet = <String, dynamic>{
      'worker_id': workerId,
      'event_type': eventType,
      'zone': zone,
      'city': city,
      'mode': mode,
      'mode_label': isSafeOverride
          ? 'Safety override evidence'
          : 'On-site scene evidence',
      'captured_at':
          photo['captured_at']?.toString() ?? DateTime.now().toIso8601String(),
      'photo': photo,
      'reason': reason,
      'notes': notes?.trim(),
      'location': locationSnapshot,
      'kyc_verified': kycVerified,
      'safe_override': isSafeOverride,
      'trust_score': trustScore,
      'trust_band': _trustBand(trustScore),
      'ml_validation_path': isSafeOverride
          ? 'Parametric trigger + blocked-access photo + GPS safe-point corroboration'
          : 'Scene photo + GPS + parametric trigger corroboration',
      'status_line': isSafeOverride
          ? 'Worker could not safely enter the disruption spot. Claim will rely on ML corroboration plus safe-boundary proof.'
          : 'Worker submitted a scene image from the disruption context to strengthen validation.',
      'checks': {
        'photo_captured': true,
        'gps_attached': gpsAttached,
        'kyc_verified': kycVerified,
        'parametric_trigger_present': true,
        'reason_provided': isSafeOverride
            ? (reason?.isNotEmpty ?? false)
            : true,
        'safety_override': isSafeOverride,
      },
    };

    for (final claimId in claimIds) {
      _claimEvidenceById[claimId] = {...packet, 'claim_id': claimId};
    }

    await _service.saveClaimEvidenceMap(_claimEvidenceById);
    await _telemetry.logClaimEvidenceSubmitted(
      eventType: eventType,
      mode: mode,
      safeOverride: isSafeOverride,
      trustScore: trustScore,
    );
    notifyListeners();
    return packet;
  }

  Future<void> clearAll() async {
    _kycProfile = null;
    _claimEvidenceById = {};
    await _service.clearAll();
    notifyListeners();
  }

  Future<Map<String, dynamic>?> _capturePhoto({
    required String category,
    bool useFrontCamera = false,
  }) async {
    _busy = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _service.capturePhoto(
        category: category,
        useFrontCamera: useFrontCamera,
      );
      _busy = false;
      notifyListeners();
      return result;
    } catch (_) {
      _busy = false;
      _errorMessage = 'Unable to capture photo right now.';
      notifyListeners();
      return null;
    }
  }

  double _computeTrustScore({
    required bool kycVerified,
    required bool gpsAttached,
    required bool isSafeOverride,
    required bool hasNotes,
  }) {
    var score = 0.48;
    if (kycVerified) score += 0.18;
    if (gpsAttached) score += 0.16;
    if (hasNotes) score += 0.04;
    score += isSafeOverride ? 0.07 : 0.14;
    return score.clamp(0.0, 0.99);
  }

  String _trustBand(double trustScore) {
    if (trustScore >= 0.85) return 'LOW';
    if (trustScore >= 0.7) return 'MEDIUM';
    if (trustScore >= 0.55) return 'ELEVATED';
    return 'HIGH';
  }
}
