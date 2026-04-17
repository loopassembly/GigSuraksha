import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../providers/claim_provider.dart';
import '../providers/verification_provider.dart';
import '../providers/worker_provider.dart';
import '../widgets/common_widgets.dart';

class ClaimsScreen extends StatefulWidget {
  const ClaimsScreen({super.key});

  @override
  State<ClaimsScreen> createState() => _ClaimsScreenState();
}

class _ClaimsScreenState extends State<ClaimsScreen> {
  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final wid = context.read<WorkerProvider>().workerId;
    if (wid != null) {
      await context.read<ClaimProvider>().fetchWorkerClaims(wid);
    }
  }

  @override
  Widget build(BuildContext context) {
    final claimProv = context.watch<ClaimProvider>();
    final verification = context.watch<VerificationProvider>();
    final claims = claimProv.claims;

    return Scaffold(
      appBar: AppBar(title: const Text('Your Claims')),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _refresh,
        child: claims.isEmpty
            ? const SingleChildScrollView(
                physics: AlwaysScrollableScrollPhysics(),
                child: SizedBox(
                  height: 400,
                  child: EmptyStateWidget(
                    icon: Icons.receipt_long_outlined,
                    title: 'No claims yet',
                    subtitle:
                        'Claims get created automatically when disruption events affect your zone.',
                  ),
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                itemCount: claims.length,
                itemBuilder: (ctx, idx) {
                  return _claimCard(
                    claims[idx],
                    verification.evidenceForClaim(
                      _claimIdOf(claims[idx]) ?? '',
                    ),
                  ).animate().fadeIn(delay: (idx * 50).ms, duration: 280.ms);
                },
              ),
      ),
    );
  }

  Widget _claimCard(
    Map<String, dynamic> claim,
    Map<String, dynamic>? evidence,
  ) {
    final eventType = claim['event_type'] as String? ?? '';
    final payout = (claim['payout_amount'] as num?)?.toDouble() ?? 0;
    final estimate = (claim['payout_estimate'] as num?)?.toDouble() ?? 0;
    final status = claim['status'] as String? ?? '';
    final severity = claim['severity'] as String? ?? '';
    final hours = (claim['affected_hours'] as num?)?.toDouble() ?? 0;
    final anomalyScore = (claim['anomaly_score'] as num?)?.toDouble() ?? 0;
    final anomalyBand = claim['anomaly_band'] as String? ?? '';
    final payoutStatus = claim['payout_status'] as String? ?? '';
    final valChecks = claim['validation_checks'] as Map<String, dynamic>? ?? {};

    final statusColor = switch (status) {
      'approved' => AppColors.success,
      'rejected' => AppColors.error,
      _ => AppColors.warning,
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
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
          // Header
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: _eventColor(eventType).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _eventIcon(eventType),
                  size: 18,
                  color: _eventColor(eventType),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      eventTypeLabels[eventType] ?? eventType,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      '${claim['city'] ?? ''} · ${claim['zone'] ?? ''}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              StatusChip(label: status.toUpperCase(), color: statusColor),
            ],
          ),

          const Divider(height: 18),

          // Details row
          Row(
            children: [
              _stat('Severity', severity.toUpperCase()),
              _stat('Affected', '${hours.toStringAsFixed(1)}h'),
              _stat('Estimate', '₹${estimate.toStringAsFixed(0)}'),
              _stat('Payout', '₹${payout.toStringAsFixed(0)}'),
            ],
          ),

          const SizedBox(height: 10),

          // Validation checks
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: valChecks.entries.map((e) {
              final ok = e.value == true;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: (ok
                      ? AppColors.successSurface
                      : AppColors.errorSurface),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      ok ? Icons.check_circle : Icons.cancel,
                      size: 12,
                      color: ok ? AppColors.success : AppColors.error,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      e.key.replaceAll('_', ' '),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: ok ? AppColors.successDark : AppColors.errorDark,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 8),

          if (evidence != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      width: 78,
                      height: 78,
                      child: _evidenceImage(evidence),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          evidence['mode_label']?.toString() ??
                              'Worker evidence',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          evidence['status_line']?.toString() ??
                              'Worker evidence attached to this claim.',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            SignalPill(
                              icon: Icons.verified_user_rounded,
                              label:
                                  'Trust ${(((evidence['trust_score'] as num?)?.toDouble() ?? 0) * 100).toStringAsFixed(0)}%',
                              color: AppColors.primaryLight,
                            ),
                            if (evidence['safe_override'] == true)
                              const SignalPill(
                                icon: Icons.warning_amber_rounded,
                                label: 'Safety override',
                                color: AppColors.warning,
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],

          // Footer
          Row(
            children: [
              RiskBadge(band: anomalyBand, fontSize: 10),
              const SizedBox(width: 8),
              Text(
                'Anomaly: ${(anomalyScore * 100).toStringAsFixed(0)}%',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textMuted,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: payoutStatus == 'processed'
                      ? AppColors.successSurface
                      : AppColors.warningSurface,
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Text(
                  'Payout: ${payoutStatus.toUpperCase()}',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: payoutStatus == 'processed'
                        ? AppColors.successDark
                        : AppColors.warningDark,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _evidenceImage(Map<String, dynamic> evidence) {
    final photo = evidence['photo'] as Map<String, dynamic>?;
    final path = photo?['path']?.toString();

    if (path != null && File(path).existsSync()) {
      return Image.file(File(path), fit: BoxFit.cover);
    }

    return Container(
      color: AppColors.surface,
      child: const Icon(Icons.camera_alt_rounded, color: AppColors.textMuted),
    );
  }

  String? _claimIdOf(Map<String, dynamic> claim) {
    return claim['claim_id']?.toString() ?? claim['id']?.toString();
  }

  Widget _stat(String label, String value) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 1),
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }

  IconData _eventIcon(String t) => switch (t) {
    'heavy_rainfall' => Icons.water_drop_rounded,
    'waterlogging' => Icons.waves_rounded,
    'heat_stress' => Icons.thermostat_rounded,
    'severe_aqi' => Icons.air_rounded,
    'platform_outage' => Icons.wifi_off_rounded,
    'dark_store_unavailable' => Icons.store_rounded,
    'zone_access_restriction' => Icons.block_rounded,
    _ => Icons.warning_rounded,
  };

  Color _eventColor(String t) => switch (t) {
    'heavy_rainfall' => AppColors.rainColor,
    'waterlogging' => AppColors.floodColor,
    'heat_stress' => AppColors.heatColor,
    'severe_aqi' => AppColors.aqiColor,
    'platform_outage' => AppColors.outageColor,
    'dark_store_unavailable' => AppColors.storeColor,
    'zone_access_restriction' => AppColors.accessColor,
    _ => AppColors.textMuted,
  };
}
