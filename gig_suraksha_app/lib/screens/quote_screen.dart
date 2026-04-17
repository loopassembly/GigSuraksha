import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../providers/policy_provider.dart';
import '../providers/worker_provider.dart';
import '../services/payment_service.dart';
import '../services/telemetry_service.dart';
import '../widgets/common_widgets.dart';

class QuoteScreen extends StatefulWidget {
  const QuoteScreen({super.key});

  @override
  State<QuoteScreen> createState() => _QuoteScreenState();
}

class _QuoteScreenState extends State<QuoteScreen> {
  String _selectedTier = 'standard';
  bool _hasRequestedQuote = false;
  bool _checkoutInProgress = false;
  String _checkoutMessage = 'Opening Razorpay checkout...';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchQuote());
  }

  Future<void> _fetchQuote() async {
    final worker = context.read<WorkerProvider>();
    final policyProv = context.read<PolicyProvider>();
    final telemetry = context.read<TelemetryService>();

    final quote = await policyProv.generateQuote(
      city: worker.workerCity,
      zone: worker.workerZone,
      shiftType: worker.workerShift,
      coverageTier: _selectedTier,
      weeklyEarnings: worker.weeklyEarnings,
      weeklyActiveHours: worker.weeklyActiveHours,
    );

    if (quote != null) {
      final premium =
          (quote['premium_breakdown'] as Map<String, dynamic>?) ?? {};
      final risk = (quote['risk_summary'] as Map<String, dynamic>?) ?? {};

      await telemetry.logQuoteGenerated(
        coverageTier: _selectedTier,
        zone: worker.workerZone,
        weeklyPremium: _weeklyPremiumAmount(premium),
        riskBand: risk['risk_band']?.toString() ?? 'unknown',
      );
    }

    if (mounted) setState(() => _hasRequestedQuote = true);
  }

  Future<void> _activatePolicy() async {
    final worker = context.read<WorkerProvider>();
    final policyProv = context.read<PolicyProvider>();
    final paymentService = context.read<PaymentService>();
    final telemetry = context.read<TelemetryService>();
    final workerId = worker.workerId;
    final quote = policyProv.latestQuote;
    final premium =
        (quote?['premium_breakdown'] as Map<String, dynamic>?) ?? {};

    if (workerId == null || quote == null) {
      _showSnackBar('Generate a quote before activating cover.', AppColors.error);
      return;
    }

    final amountInPaise = _weeklyPremiumAmountInPaise(premium);
    if (amountInPaise <= 0) {
      _showSnackBar('Weekly premium unavailable. Please retry.', AppColors.error);
      return;
    }

    setState(() {
      _checkoutInProgress = true;
      _checkoutMessage = 'Opening Razorpay checkout...';
    });

    final paymentResult = await paymentService.startWeeklyCoverCheckout(
      workerName: worker.workerName.isEmpty
          ? 'GigSuraksha Worker'
          : worker.workerName,
      coverageTier: _selectedTier,
      zone: worker.workerZone,
      amountInPaise: amountInPaise,
      phone: worker.workerPhone,
    );

    if (!mounted) return;

    if (!paymentResult.isSuccess) {
      setState(() => _checkoutInProgress = false);
      _showSnackBar(
        paymentResult.message ?? 'Payment was not completed.',
        paymentResult.outcome == PaymentOutcome.externalWallet
            ? AppColors.warning
            : AppColors.error,
      );
      return;
    }

    setState(() {
      _checkoutInProgress = true;
      _checkoutMessage = 'Payment received. Activating cover...';
    });

    final result = await policyProv.activatePolicy(
      workerId: workerId,
      coverageTier: _selectedTier,
    );

    if (!mounted) return;
    setState(() => _checkoutInProgress = false);

    if (result != null) {
      await telemetry.logPolicyActivated(
        coverageTier: _selectedTier,
        zone: worker.workerZone,
        weeklyPremium: _weeklyPremiumAmount(premium),
      );
      if (!mounted) return;
      _showSnackBar(
        'Policy activated. Payment ${paymentResult.paymentId ?? 'confirmed'} received.',
        AppColors.success,
      );
      Navigator.of(context).pop();
    } else {
      _showSnackBar(
        policyProv.error ?? 'Policy activation failed.',
        AppColors.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final policyProv = context.watch<PolicyProvider>();
    final quote = policyProv.latestQuote;

    return Scaffold(
      appBar: AppBar(title: const Text('Weekly Quote')),
      body: Stack(
        children: [
          if (quote != null)
            _quoteBody(quote)
          else if (policyProv.error != null)
            _errorBody(policyProv.error!)
          else
            _loadingBody(),
          if (_checkoutInProgress ||
              (policyProv.loading && _hasRequestedQuote && quote != null))
            LoadingOverlay(
              visible: true,
              message: _checkoutInProgress
                  ? _checkoutMessage
                  : 'Refreshing cover...',
            ),
        ],
      ),
    );
  }

  Widget _loadingBody() {
    return const SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(16, 8, 16, 80),
      child: QuoteSkeleton(),
    );
  }

  Widget _errorBody(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.errorSurface,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(Icons.error_outline, color: AppColors.error, size: 28),
            ),
            const SizedBox(height: 16),
            const Text(
              'Could not generate quote',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              error,
              style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _fetchQuote,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _quoteBody(Map<String, dynamic> quote) {
    final worker = context.watch<WorkerProvider>();
    final risk = quote['risk_summary'] as Map<String, dynamic>? ?? {};
    final premium = quote['premium_breakdown'] as Map<String, dynamic>? ?? {};
    final coverage = quote['coverage_summary'] as Map<String, dynamic>? ?? {};
    final riskDrivers = (risk['top_risk_drivers'] as List<dynamic>? ?? [])
        .map((d) => d.toString())
        .toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hero card — indigo
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Your weekly quote for ${worker.workerZone}',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${shiftTypeLabels[worker.workerShift] ?? worker.workerShift} shift · AI-priced',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _heroStat('Premium', '₹${premium['final_weekly_premium'] ?? '—'}', '/week')),
                    Expanded(child: _heroStat('Max Payout', '₹${coverage['max_weekly_payout'] ?? '—'}', '/week')),
                    Expanded(child: _heroStat('Risk', '${risk['risk_band'] ?? '—'}', 'forecast')),
                  ],
                ),
              ],
            ),
          ).animate().fadeIn(duration: 280.ms),

          const SizedBox(height: 16),

          // Tier selection
          const SectionHeader(
            title: 'Coverage Tier',
            subtitle: 'Switch to see how price changes.',
          ),
          ...coverageTiers.map((tier) {
            final selected = _selectedTier == tier.id;
            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              decoration: BoxDecoration(
                color: selected ? AppColors.primaryFaint : AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: selected
                      ? AppColors.primary.withValues(alpha: 0.3)
                      : AppColors.border,
                ),
              ),
              child: ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                onTap: () {
                  setState(() => _selectedTier = tier.id);
                  _fetchQuote();
                },
                leading: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : AppColors.surfaceElevated,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    tier.id == 'basic'
                        ? Icons.shield_outlined
                        : tier.id == 'standard'
                        ? Icons.shield_rounded
                        : Icons.workspace_premium_rounded,
                    size: 18,
                    color: selected ? Colors.white : AppColors.textMuted,
                  ),
                ),
                title: Row(
                  children: [
                    Text(
                      tier.name,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: selected ? AppColors.textPrimary : AppColors.textSecondary,
                      ),
                    ),
                    if (tier.id == 'standard') ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'POPULAR',
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.primary),
                        ),
                      ),
                    ],
                  ],
                ),
                subtitle: Text(
                  '${tier.coveragePercent}% cover · Max ₹${tier.maxWeeklyPayout}/week',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
                trailing: selected
                    ? const Icon(Icons.check_circle, color: AppColors.primary, size: 20)
                    : null,
              ),
            );
          }),

          const SizedBox(height: 16),

          // Premium breakdown
          const SectionHeader(title: 'Premium Breakdown'),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                PremiumRow(label: 'Base premium', value: '₹${premium['base_premium'] ?? '—'}'),
                PremiumRow(label: 'Zone risk loading', value: '₹${premium['zone_risk_loading'] ?? '—'}', hint: worker.workerZone),
                PremiumRow(label: 'Shift exposure', value: '₹${premium['shift_exposure_loading'] ?? '—'}', hint: shiftTypeLabels[worker.workerShift] ?? worker.workerShift),
                PremiumRow(label: 'Coverage factor', value: '₹${premium['coverage_factor'] ?? '—'}', hint: coverageTierLabels[_selectedTier] ?? _selectedTier),
                PremiumRow(label: 'ML risk loading', value: '₹${premium['ml_risk_loading'] ?? '—'}', hint: 'Predictive disruption score'),
                PremiumRow(label: 'Safe zone discount', value: '-₹${premium['safe_zone_discount'] ?? '—'}', isDiscount: true),
                const Divider(height: 20),
                PremiumRow(label: 'Weekly premium', value: '₹${premium['final_weekly_premium'] ?? '—'}/wk', isTotal: true),
              ],
            ),
          ).animate().fadeIn(delay: 100.ms, duration: 280.ms),

          const SizedBox(height: 16),

          // Risk & Coverage side by side
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Risk', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      const SizedBox(height: 8),
                      Text(
                        '${risk['risk_score'] ?? '—'}',
                        style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 4),
                      RiskBadge(band: risk['risk_band']?.toString() ?? '—'),
                      const SizedBox(height: 8),
                      Text(
                        '${(risk['expected_disrupted_hours'] as num?)?.toStringAsFixed(1) ?? '—'} hrs/wk disruption',
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                      if (riskDrivers.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        ...riskDrivers.map((d) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            children: [
                              const Icon(Icons.circle, size: 5, color: AppColors.textMuted),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  d,
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                ),
                              ),
                            ],
                          ),
                        )),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Coverage', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      const SizedBox(height: 8),
                      Text(
                        '${coverage['coverage_percent'] ?? '—'}%',
                        style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.primary),
                      ),
                      const SizedBox(height: 8),
                      _coverageDetail('Protected hrs', '${(coverage['protected_hours_basis'] as num?)?.toStringAsFixed(1) ?? '—'}/wk'),
                      _coverageDetail('Income', '₹${(coverage['protected_weekly_income'] as num?)?.toStringAsFixed(0) ?? '—'}/wk'),
                      _coverageDetail('Hourly rate', '₹${(coverage['protected_hourly_income'] as num?)?.toStringAsFixed(0) ?? '—'}/hr'),
                      _coverageDetail('Max payout', '₹${coverage['max_weekly_payout'] ?? '—'}/wk'),
                    ],
                  ),
                ),
              ),
            ],
          ).animate().fadeIn(delay: 180.ms, duration: 280.ms),

          const SizedBox(height: 16),

          // Payment note
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.warningSurface,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, size: 16, color: AppColors.warningDark),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Razorpay test mode — card details are mock, no real charge.',
                    style: TextStyle(fontSize: 12, color: AppColors.warningDark),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Activate button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _checkoutInProgress ? null : _activatePolicy,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 15),
              ),
              child: Text(
                'Pay & Activate — ₹${premium['final_weekly_premium'] ?? '—'}/week',
              ),
            ),
          ).animate().fadeIn(delay: 260.ms, duration: 280.ms),
        ],
      ),
    );
  }

  Widget _heroStat(String label, String value, String sub) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: Colors.white.withValues(alpha: 0.6),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          Text(
            sub,
            style: TextStyle(
              fontSize: 10,
              color: Colors.white.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _coverageDetail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  double _weeklyPremiumAmount(Map<String, dynamic> premium) {
    return (premium['final_weekly_premium'] as num?)?.toDouble() ?? 0;
  }

  int _weeklyPremiumAmountInPaise(Map<String, dynamic> premium) {
    return (_weeklyPremiumAmount(premium) * 100).round();
  }

  void _showSnackBar(String message, Color backgroundColor) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: backgroundColor),
    );
  }
}
