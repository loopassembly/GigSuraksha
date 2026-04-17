import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../providers/worker_provider.dart';
import '../providers/policy_provider.dart';
import '../providers/claim_provider.dart';
import '../providers/verification_provider.dart';
import '../widgets/common_widgets.dart';
import 'welcome_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final worker = context.watch<WorkerProvider>();
    final policyProv = context.watch<PolicyProvider>();
    final claimProv = context.watch<ClaimProvider>();
    final verification = context.watch<VerificationProvider>();
    final kycAngles =
        verification.kycProfile?['angles'] as Map<String, dynamic>? ?? {};

    return Column(
      children: [
        _buildProfileHeader(worker),
        Expanded(
          child: Container(
            decoration: const BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(28),
                topRight: Radius.circular(28),
              ),
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 90),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
          // Stats
          Row(
            children: [
              Expanded(
                child: StatTile(
                  icon: Icons.shield_rounded,
                  iconColor: AppColors.primary,
                  label: 'Policies',
                  value: policyProv.policies.length.toString(),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: StatTile(
                  icon: Icons.receipt_long_rounded,
                  iconColor: AppColors.accent,
                  label: 'Claims',
                  value: claimProv.totalClaims.toString(),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: StatTile(
                  icon: Icons.payments_outlined,
                  iconColor: AppColors.success,
                  label: 'Earned',
                  value: '₹${claimProv.totalPayouts.toStringAsFixed(0)}',
                ),
              ),
            ],
          ).animate().fadeIn(delay: 60.ms, duration: 280.ms),

          const SizedBox(height: 20),

          const SectionHeader(
            title: 'Identity & Claim Trust',
            subtitle:
                'KYC and worker-supplied evidence strengthen fraud detection.',
          ),
          GlassCard(
            padding: const EdgeInsets.all(18),
            gradient: AppColors.signalGradient,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    SignalPill(
                      icon: Icons.verified_user_rounded,
                      label: verification.isKycVerified
                          ? 'KYC verified'
                          : 'KYC missing',
                      color: verification.isKycVerified
                          ? AppColors.success
                          : AppColors.warning,
                    ),
                    SignalPill(
                      icon: Icons.fact_check_rounded,
                      label:
                          '${verification.claimEvidenceCount} evidence packet${verification.claimEvidenceCount == 1 ? '' : 's'}',
                      color: AppColors.accent,
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  verification.isKycVerified
                      ? 'Three-angle selfie verification is stored for this worker and can be combined with claim evidence during fraud review.'
                      : 'This worker session has no KYC packet yet. New registrations now require a three-angle selfie capture.',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.45,
                  ),
                ),
                if (kycAngles.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: kycAngleLabels.keys.map((angle) {
                      final shot = kycAngles[angle] as Map<String, dynamic>?;
                      return Expanded(
                        child: Container(
                          margin: EdgeInsets.only(
                            right: angle == 'right' ? 0 : 8,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: SizedBox(
                                  height: 112,
                                  width: double.infinity,
                                  child: _kycImage(shot),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                kycAngleLabels[angle] ?? angle,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ).animate().fadeIn(delay: 100.ms, duration: 280.ms),

          const SizedBox(height: 20),

          // Work details
          const SectionHeader(title: 'Work Details'),
          Container(
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
                _detailRow(
                  Icons.location_city_rounded,
                  'City',
                  worker.workerCity,
                ),
                _divider(),
                _detailRow(
                  Icons.delivery_dining_rounded,
                  'Platform',
                  worker.workerPlatform,
                ),
                _divider(),
                _detailRow(
                  Icons.location_on_rounded,
                  'Zone',
                  worker.workerZone,
                ),
                _divider(),
                _detailRow(
                  Icons.schedule_rounded,
                  'Shift',
                  shiftTypeLabels[worker.workerShift] ?? worker.workerShift,
                ),
                _divider(),
                _detailRow(
                  Icons.currency_rupee_rounded,
                  'Weekly Earnings',
                  '₹${worker.weeklyEarnings.toStringAsFixed(0)}',
                ),
                _divider(),
                _detailRow(
                  Icons.access_time_rounded,
                  'Active Hours',
                  '${worker.weeklyActiveHours.toStringAsFixed(0)} hrs/week',
                ),
              ],
            ),
          ).animate().fadeIn(delay: 120.ms, duration: 280.ms),

          const SizedBox(height: 20),

          // Settings
          const SectionHeader(title: 'Settings'),
          Container(
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
                _settingRow(
                  Icons.notifications_outlined,
                  'Notifications',
                  subtitle: 'Disruption alerts & claim updates',
                  trailing: Switch.adaptive(
                    value: true,
                    onChanged: (_) {},
                    activeColor: AppColors.primary,
                  ),
                ),
                _divider(),
                _settingRow(
                  Icons.gps_fixed_rounded,
                  'Location Services',
                  subtitle: 'GPS tracking for claim validation',
                  trailing: Switch.adaptive(
                    value: true,
                    onChanged: (_) {},
                    activeColor: AppColors.primary,
                  ),
                ),
                _divider(),
                _settingRow(
                  Icons.info_outline_rounded,
                  'About',
                  subtitle: 'GigSuraksha · Phase 3 Demo',
                ),
              ],
            ),
          ).animate().fadeIn(delay: 180.ms, duration: 280.ms),

          const SizedBox(height: 20),

          // Logout
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.logout_rounded, size: 18),
              label: const Text('Log Out'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.error, width: 0.5),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: () => _confirmLogout(context),
            ),
          ).animate().fadeIn(delay: 240.ms, duration: 280.ms),
        ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileHeader(WorkerProvider worker) {
    final name = worker.workerName.isNotEmpty ? worker.workerName : 'Worker';
    return Container(
      color: AppColors.primary,
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B7533),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      name[0].toUpperCase(),
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primaryLight,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${worker.workerCity} · ${worker.workerPlatform}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.55),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.notifications_outlined,
                    size: 20,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textMuted),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
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

  Widget _settingRow(
    IconData icon,
    String title, {
    String? subtitle,
    Widget? trailing,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textMuted),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (subtitle != null)
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textMuted,
                    ),
                  ),
              ],
            ),
          ),
          if (trailing != null) trailing,
        ],
      ),
    );
  }

  Widget _divider() {
    return const Divider(height: 1, indent: 42, color: AppColors.border);
  }

  Future<void> _confirmLogout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text(
          'This will clear your session. You can register again anytime.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Log Out',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final verification = context.read<VerificationProvider>();
      final worker = context.read<WorkerProvider>();
      await verification.clearAll();
      await worker.logout();
      if (!context.mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const WelcomeScreen()),
        (_) => false,
      );
    }
  }

  Widget _kycImage(Map<String, dynamic>? shot) {
    final path = shot?['path']?.toString();
    if (path != null && File(path).existsSync()) {
      return Image.file(File(path), fit: BoxFit.cover);
    }

    return Container(
      color: AppColors.surfaceElevated,
      child: const Icon(Icons.camera_front_rounded, color: AppColors.textMuted),
    );
  }
}
