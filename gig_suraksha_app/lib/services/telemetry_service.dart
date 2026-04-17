import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';

class TelemetryService {
  const TelemetryService._({FirebaseAnalytics? analytics})
    : _analytics = analytics;

  final FirebaseAnalytics? _analytics;

  factory TelemetryService.disabled() => const TelemetryService._();

  factory TelemetryService.live({required FirebaseAnalytics analytics}) =>
      TelemetryService._(analytics: analytics);

  List<NavigatorObserver> get navigatorObservers {
    final analytics = _analytics;
    if (analytics == null) {
      return const [];
    }
    return [FirebaseAnalyticsObserver(analytics: analytics)];
  }

  Future<void> logAppOpened() async {
    if (_analytics == null) return;
    await _analytics.logAppOpen();
  }

  Future<void> setWorkerContext({
    String? workerId,
    String? city,
    String? zone,
    String? platform,
    String? shiftType,
  }) async {
    if (_analytics == null) return;

    if (workerId != null && workerId.isNotEmpty) {
      await _analytics.setUserId(id: workerId);
    }

    await _setUserProperty('worker_city', city);
    await _setUserProperty('worker_zone', zone);
    await _setUserProperty('worker_platform', platform);
    await _setUserProperty('worker_shift', shiftType);
  }

  Future<void> logOnboardingCompleted({
    required String city,
    required String zone,
    required String platform,
  }) async {
    if (_analytics == null) return;

    await _analytics.logEvent(
      name: 'worker_onboarding_completed',
      parameters: {'city': city, 'zone': zone, 'platform': platform},
    );
  }

  Future<void> logQuoteGenerated({
    required String coverageTier,
    required String zone,
    required num weeklyPremium,
    required String riskBand,
  }) async {
    if (_analytics == null) return;

    await _analytics.logEvent(
      name: 'weekly_quote_generated',
      parameters: {
        'coverage_tier': coverageTier,
        'zone': zone,
        'weekly_premium': weeklyPremium.toDouble(),
        'risk_band': riskBand,
      },
    );
  }

  Future<void> logCheckoutStarted({
    required String coverageTier,
    required String zone,
    required int amountInPaise,
  }) async {
    if (_analytics == null) return;

    await _analytics.logEvent(
      name: 'weekly_checkout_started',
      parameters: {
        'coverage_tier': coverageTier,
        'zone': zone,
        'amount_in_paise': amountInPaise,
      },
    );
  }

  Future<void> logCheckoutCompleted({
    required String coverageTier,
    required String zone,
    required int amountInPaise,
    required String paymentId,
  }) async {
    if (_analytics == null) return;

    await _analytics.logEvent(
      name: 'weekly_checkout_completed',
      parameters: {
        'coverage_tier': coverageTier,
        'zone': zone,
        'amount_in_paise': amountInPaise,
        'payment_id': paymentId,
      },
    );
  }

  Future<void> logCheckoutFailed({
    required String coverageTier,
    required String zone,
    required String reason,
  }) async {
    if (_analytics == null) return;

    await _analytics.logEvent(
      name: 'weekly_checkout_failed',
      parameters: {
        'coverage_tier': coverageTier,
        'zone': zone,
        'reason': reason,
      },
    );
  }

  Future<void> logPolicyActivated({
    required String coverageTier,
    required String zone,
    required num weeklyPremium,
  }) async {
    if (_analytics == null) return;

    await _analytics.logEvent(
      name: 'weekly_policy_activated',
      parameters: {
        'coverage_tier': coverageTier,
        'zone': zone,
        'weekly_premium': weeklyPremium.toDouble(),
      },
    );
  }

  Future<void> logTrackingState({
    required bool active,
    required String zone,
    required int samples,
    required double distanceMeters,
  }) async {
    if (_analytics == null) return;

    await _analytics.logEvent(
      name: active ? 'gps_tracking_started' : 'gps_tracking_stopped',
      parameters: {
        'zone': zone,
        'samples': samples,
        'distance_meters': distanceMeters,
      },
    );
  }

  Future<void> logKycCompleted({
    required String city,
    required int captureCount,
  }) async {
    if (_analytics == null) return;

    await _analytics.logEvent(
      name: 'kyc_completed',
      parameters: {'city': city, 'capture_count': captureCount},
    );
  }

  Future<void> logClaimEvidenceSubmitted({
    required String eventType,
    required String mode,
    required bool safeOverride,
    required double trustScore,
  }) async {
    if (_analytics == null) return;

    await _analytics.logEvent(
      name: 'claim_evidence_submitted',
      parameters: {
        'event_type': eventType,
        'mode': mode,
        'safe_override': safeOverride.toString(),
        'trust_score': trustScore,
      },
    );
  }

  Future<void> _setUserProperty(String name, String? value) async {
    if (_analytics == null || value == null || value.isEmpty) {
      return;
    }
    await _analytics.setUserProperty(name: name, value: value);
  }
}
