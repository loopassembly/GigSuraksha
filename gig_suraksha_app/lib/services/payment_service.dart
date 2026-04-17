import 'dart:async';

import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../config/app_config.dart';
import 'telemetry_service.dart';

enum PaymentOutcome { success, failure, externalWallet, unavailable }

class PaymentResult {
  const PaymentResult({
    required this.outcome,
    this.paymentId,
    this.orderId,
    this.signature,
    this.message,
    this.code,
    this.externalWallet,
  });

  final PaymentOutcome outcome;
  final String? paymentId;
  final String? orderId;
  final String? signature;
  final String? message;
  final String? code;
  final String? externalWallet;

  bool get isSuccess => outcome == PaymentOutcome.success;
}

class PaymentService {
  PaymentService({TelemetryService? telemetry, String? keyId})
    : _telemetry = telemetry,
      _keyId = (keyId ?? AppConfig.razorpayKeyId).trim() {
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handleSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handleError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  final TelemetryService? _telemetry;
  final String _keyId;
  late final Razorpay _razorpay;
  Completer<PaymentResult>? _pendingCheckout;
  _CheckoutContext? _pendingContext;

  bool get isConfigured => _keyId.isNotEmpty;

  Future<PaymentResult> startWeeklyCoverCheckout({
    required String workerName,
    required String coverageTier,
    required String zone,
    required int amountInPaise,
    String? phone,
  }) async {
    if (!isConfigured) {
      return const PaymentResult(
        outcome: PaymentOutcome.unavailable,
        message:
            'Razorpay key is missing. Add a publishable key ID to continue.',
      );
    }

    if (amountInPaise <= 0) {
      return const PaymentResult(
        outcome: PaymentOutcome.failure,
        message: 'Weekly premium amount is invalid.',
      );
    }

    if (_pendingCheckout != null && !_pendingCheckout!.isCompleted) {
      return const PaymentResult(
        outcome: PaymentOutcome.failure,
        message: 'A payment is already in progress.',
      );
    }

    _pendingContext = _CheckoutContext(
      coverageTier: coverageTier,
      zone: zone,
      amountInPaise: amountInPaise,
    );
    _pendingCheckout = Completer<PaymentResult>();

    await _telemetry?.logCheckoutStarted(
      coverageTier: coverageTier,
      zone: zone,
      amountInPaise: amountInPaise,
    );

    final prefill = <String, String>{};
    if (phone != null && phone.trim().isNotEmpty) {
      prefill['contact'] = phone.trim();
    }

    _razorpay.open({
      'key': _keyId,
      'amount': amountInPaise,
      'currency': AppConfig.paymentCurrency,
      'name': AppConfig.merchantName,
      'description':
          '${AppConfig.merchantTagline} • ${coverageTier.toUpperCase()} tier',
      'retry': {'enabled': true, 'max_count': 2},
      'send_sms_hash': true,
      'timeout': 300,
      'prefill': prefill,
      'theme': {'color': '#6366F1'},
      'notes': {
        'product': 'weekly_income_protection',
        'coverage_tier': coverageTier,
        'zone': zone,
        'worker_name': workerName,
      },
    });

    return _pendingCheckout!.future.timeout(
      const Duration(minutes: 5),
      onTimeout: () {
        const result = PaymentResult(
          outcome: PaymentOutcome.failure,
          message: 'Payment timed out. Please try again.',
        );
        _complete(result);
        return result;
      },
    );
  }

  void _handleSuccess(PaymentSuccessResponse response) {
    final context = _pendingContext;
    if (context != null) {
      _telemetry?.logCheckoutCompleted(
        coverageTier: context.coverageTier,
        zone: context.zone,
        amountInPaise: context.amountInPaise,
        paymentId: response.paymentId ?? 'unknown',
      );
    }

    _complete(
      PaymentResult(
        outcome: PaymentOutcome.success,
        paymentId: response.paymentId,
        orderId: response.orderId,
        signature: response.signature,
      ),
    );
  }

  void _handleError(PaymentFailureResponse response) {
    final context = _pendingContext;
    final message = response.message ?? 'Payment was cancelled.';

    if (context != null) {
      _telemetry?.logCheckoutFailed(
        coverageTier: context.coverageTier,
        zone: context.zone,
        reason: message,
      );
    }

    _complete(
      PaymentResult(
        outcome: PaymentOutcome.failure,
        code: response.code?.toString(),
        message: message,
      ),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    _complete(
      PaymentResult(
        outcome: PaymentOutcome.externalWallet,
        externalWallet: response.walletName,
        message:
            '${response.walletName ?? 'External wallet'} was selected. Please finish the checkout there.',
      ),
    );
  }

  void _complete(PaymentResult result) {
    final completer = _pendingCheckout;
    if (completer != null && !completer.isCompleted) {
      completer.complete(result);
    }
    _pendingCheckout = null;
    _pendingContext = null;
  }

  void dispose() {
    _razorpay.clear();
  }
}

class _CheckoutContext {
  const _CheckoutContext({
    required this.coverageTier,
    required this.zone,
    required this.amountInPaise,
  });

  final String coverageTier;
  final String zone;
  final int amountInPaise;
}
