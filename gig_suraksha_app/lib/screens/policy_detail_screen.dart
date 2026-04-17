import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../widgets/common_widgets.dart';

class PolicyDetailScreen extends StatelessWidget {
  final Map<String, dynamic> policy;

  const PolicyDetailScreen({super.key, required this.policy});

  @override
  Widget build(BuildContext context) {
    final risk = policy['risk_summary'] as Map<String, dynamic>? ?? {};
    final premium = policy['premium_breakdown'] as Map<String, dynamic>? ?? {};
    final coverage = policy['coverage_summary'] as Map<String, dynamic>? ?? {};
    final status = policy['status'] as String? ?? '';

    final statusColor = switch (status) {
      'active' => AppColors.success,
      'expired' => AppColors.textMuted,
      'cancelled' => AppColors.error,
      _ => AppColors.warning,
    };

    return Scaffold(
      appBar: AppBar(title: const Text('Policy Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: status == 'active'
                              ? AppColors.primary
                              : AppColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.shield_rounded,
                          size: 20,
                          color: status == 'active'
                              ? Colors.white
                              : AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Policy #${(policy['policy_id'] as String?)?.substring(0, 8) ?? '—'}',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              '${coverageTierLabels[policy['coverage_tier']] ?? ''} Coverage',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      StatusChip(label: status.toUpperCase(), color: statusColor),
                    ],
                  ),
                  const Divider(height: 20),
                  _row('City', policy['city']?.toString() ?? '—'),
                  _row('Zone', policy['zone']?.toString() ?? '—'),
                  _row(
                    'Shift',
                    shiftTypeLabels[policy['shift_type']] ??
                        policy['shift_type']?.toString() ?? '—',
                  ),
                  _row('Valid From', _fmtDate(policy['valid_from'])),
                  _row('Valid To', _fmtDate(policy['valid_to'])),
                ],
              ),
            ).animate().fadeIn(duration: 280.ms),

            const SizedBox(height: 16),

            // Risk
            const SectionHeader(title: 'Risk Assessment'),
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
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Risk Score',
                              style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${risk['risk_score'] ?? '—'}',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      RiskBadge(
                        band: risk['risk_band']?.toString() ?? '—',
                        fontSize: 13,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  _row(
                    'Expected Disrupted Hours',
                    '${risk['expected_disrupted_hours']?.toStringAsFixed(1) ?? '—'} hrs',
                  ),
                  _row('Premium Loading', '₹${risk['premium_loading'] ?? '—'}'),
                ],
              ),
            ).animate().fadeIn(delay: 60.ms, duration: 300.ms),

            const SizedBox(height: 16),

            // Premium
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
                  PremiumRow(label: 'Base Premium', value: '₹${premium['base_premium'] ?? '—'}'),
                  PremiumRow(label: 'Zone Risk Loading', value: '₹${premium['zone_risk_loading'] ?? '—'}'),
                  PremiumRow(label: 'Shift Exposure', value: '₹${premium['shift_exposure_loading'] ?? '—'}'),
                  PremiumRow(label: 'Coverage Factor', value: '₹${premium['coverage_factor'] ?? '—'}'),
                  PremiumRow(label: 'ML Risk Loading', value: '₹${premium['ml_risk_loading'] ?? '—'}'),
                  PremiumRow(label: 'Safe Zone Discount', value: '-₹${premium['safe_zone_discount'] ?? '—'}', isDiscount: true),
                  const Divider(),
                  PremiumRow(label: 'Weekly Premium', value: '₹${premium['final_weekly_premium'] ?? '—'}/wk', isTotal: true),
                ],
              ),
            ).animate().fadeIn(delay: 120.ms, duration: 300.ms),

            const SizedBox(height: 16),

            // Coverage
            const SectionHeader(title: 'Coverage Summary'),
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
                  _row('Coverage Percent', '${coverage['coverage_percent'] ?? '—'}%'),
                  _row('Max Weekly Payout', '₹${coverage['max_weekly_payout'] ?? '—'}'),
                  _row('Protected Hours', '${coverage['protected_hours_basis']?.toStringAsFixed(1) ?? '—'}/wk'),
                  _row('Protected Income', '₹${coverage['protected_weekly_income']?.toStringAsFixed(0) ?? '—'}/wk'),
                  _row('Hourly Rate', '₹${coverage['protected_hourly_income']?.toStringAsFixed(0) ?? '—'}/hr'),
                ],
              ),
            ).animate().fadeIn(delay: 180.ms, duration: 300.ms),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  String _fmtDate(dynamic d) {
    if (d == null) return '—';
    try {
      final dt = DateTime.parse(d.toString());
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return d.toString();
    }
  }
}
