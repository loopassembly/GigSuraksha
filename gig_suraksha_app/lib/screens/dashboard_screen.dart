import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../providers/claim_provider.dart';
import '../providers/policy_provider.dart';
import '../providers/worker_provider.dart';
import '../widgets/common_widgets.dart';
import 'claims_screen.dart';
import 'policy_detail_screen.dart';
import 'quote_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final wid = context.read<WorkerProvider>().workerId;
    if (wid == null) return;
    await Future.wait([
      context.read<PolicyProvider>().fetchPolicies(wid),
      context.read<ClaimProvider>().fetchWorkerClaims(wid),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final worker = context.watch<WorkerProvider>();
    final policyProv = context.watch<PolicyProvider>();
    final claimProv = context.watch<ClaimProvider>();
    final active = policyProv.activePolicy;
    final isLoading =
        (policyProv.loading || claimProv.loading) && claimProv.claims.isEmpty;

    return Column(
      children: [
        // ── Amber hero header ──────────────────────────────────
        _HeroHeader(worker: worker),

        // ── White scrollable content ───────────────────────────
        Expanded(
          child: Container(
            decoration: const BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(28),
                topRight: Radius.circular(28),
              ),
            ),
            child: RefreshIndicator(
              color: AppColors.primaryDark,
              onRefresh: _loadData,
              child: isLoading
                  ? const Center(child: DashboardSkeleton())
                  : SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 18, 16, 90),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Cover ID card
                          _CoverCard(
                            worker: worker,
                            activePolicy: active,
                            onQuoteTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const QuoteScreen(),
                              ),
                            ),
                          ).animate().fadeIn(duration: 280.ms),

                          const SizedBox(height: 12),

                          // Stats row
                          Row(
                            children: [
                              Expanded(
                                child: _StatCard(
                                  icon: Icons.shield_rounded,
                                  iconColor: AppColors.primaryDark,
                                  label: 'Active cover',
                                  value: policyProv.policies
                                      .where((p) => p['status'] == 'active')
                                      .length
                                      .toString(),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _StatCard(
                                  icon: Icons.receipt_rounded,
                                  iconColor: AppColors.accent,
                                  label: 'Total claims',
                                  value: claimProv.totalClaims.toString(),
                                  sub: '${claimProv.pendingCount} pending',
                                  subColor: AppColors.accent,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _StatCard(
                                  icon: Icons.credit_card_rounded,
                                  iconColor: AppColors.success,
                                  label: 'Paid out',
                                  value:
                                      '₹${claimProv.totalPayouts.toStringAsFixed(0)}',
                                ),
                              ),
                            ],
                          ).animate().fadeIn(delay: 60.ms, duration: 280.ms),

                          const SizedBox(height: 20),

                          // Protection status section
                          const Text(
                            'Protection Status',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Your weekly cover',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textMuted,
                            ),
                          ),
                          const SizedBox(height: 12),

                          if (active != null)
                            _buildPolicyCard(active)
                                .animate()
                                .fadeIn(delay: 120.ms, duration: 280.ms)
                          else
                            _buildNoCoverCard()
                                .animate()
                                .fadeIn(delay: 120.ms, duration: 280.ms),

                          const SizedBox(height: 20),

                          // Recent claims
                          Row(
                            children: [
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Recent Claims',
                                      style: TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    Text(
                                      'Auto-generated on disruption events',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (claimProv.claims.isNotEmpty)
                                TextButton(
                                  onPressed: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const ClaimsScreen(),
                                    ),
                                  ),
                                  child: const Text('See all'),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          if (claimProv.claims.isEmpty)
                            const EmptyStateWidget(
                              icon: Icons.receipt_long_outlined,
                              title: 'No claims yet',
                              subtitle:
                                  'Use the simulator to trigger a disruption event.',
                            )
                          else
                            ...claimProv.claims.take(3).toList().asMap().entries.map(
                              (entry) => _buildClaimTile(entry.value)
                                  .animate()
                                  .fadeIn(
                                    delay: (180 + entry.key * 50).ms,
                                    duration: 260.ms,
                                  ),
                            ),
                        ],
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPolicyCard(Map<String, dynamic> policy) {
    final premium = policy['premium_breakdown'] as Map<String, dynamic>? ?? {};
    final coverage = policy['coverage_summary'] as Map<String, dynamic>? ?? {};
    final risk = policy['risk_summary'] as Map<String, dynamic>? ?? {};

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_rounded, color: AppColors.primaryDark, size: 20),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Active Protection',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.successSurface,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'ACTIVE',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.success,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 20),
          Row(
            children: [
              _policyDetail('Premium', '₹${_numStr(premium['final_weekly_premium'])}/wk'),
              _policyDetail('Max Payout', '₹${_numStr(coverage['max_weekly_payout'])}/wk'),
              _policyDetail('Risk', risk['risk_band']?.toString().toUpperCase() ?? '—'),
              _policyDetail('Tier', (policy['coverage_tier'] ?? '—').toString().toUpperCase()),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => PolicyDetailScreen(policy: policy),
                ),
              ),
              child: const Text('View Policy Details'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoCoverCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primaryFaint,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primaryDark.withValues(alpha: 0.25)),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            bottom: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primaryDark.withValues(alpha: 0.08),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primaryDark,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.shield_outlined,
                      size: 20,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Not protected yet',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text(
                'Generate a weekly quote to activate income protection for your zone and shift.',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const QuoteScreen()),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.textPrimary,
                    foregroundColor: AppColors.primaryDark,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Get Weekly Cover',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildClaimTile(Map<String, dynamic> claim) {
    final type = claim['event_type'] as String? ?? '';
    final status = claim['status'] as String? ?? '';
    final payout = (claim['payout_amount'] as num?)?.toDouble() ?? 0;
    final hours = (claim['affected_hours'] as num?)?.toDouble() ?? 0;

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
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _eventColor(type).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(_eventIcon(type), color: _eventColor(type), size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  eventTypeLabels[type] ?? type,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  '${hours.toStringAsFixed(1)}h affected',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹${payout.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _policyDetail(String label, String value) {
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
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
        ],
      ),
    );
  }

  String _numStr(Object? v) => (v as num?)?.toStringAsFixed(0) ?? '—';

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

// ── Amber hero header ──────────────────────────────────────────
class _HeroHeader extends StatelessWidget {
  final WorkerProvider worker;
  const _HeroHeader({required this.worker});

  @override
  Widget build(BuildContext context) {
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,';
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
            // Greeting row
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B7533),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'A',
                      style: const TextStyle(
                        fontSize: 18,
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
                        greeting,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      Text(
                        'Hey $name',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                          height: 1.2,
                        ),
                      ),
                      if (worker.workerZone.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(
                              Icons.location_on_rounded,
                              size: 12,
                              color: AppColors.textSecondary,
                            ),
                            const SizedBox(width: 2),
                            Text(
                              worker.workerZone,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                // Bell
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
            const SizedBox(height: 16),
            // Search bar
            Container(
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primaryFaint,
                borderRadius: BorderRadius.circular(22),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                children: const [
                  Icon(Icons.search_rounded, size: 18, color: AppColors.textMuted),
                  SizedBox(width: 8),
                  Text(
                    'Search cover or claim...',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Cover ID card ──────────────────────────────────────────────
class _CoverCard extends StatelessWidget {
  final WorkerProvider worker;
  final Map<String, dynamic>? activePolicy;
  final VoidCallback onQuoteTap;

  const _CoverCard({
    required this.worker,
    required this.activePolicy,
    required this.onQuoteTap,
  });

  @override
  Widget build(BuildContext context) {
    final policyId = activePolicy?['id']?.toString() ?? '000000';
    final displayId = '#GS-${policyId.length > 6 ? policyId.substring(policyId.length - 6).toUpperCase() : policyId.padLeft(6, '0')}';
    final shiftLabel = shiftTypeLabels[worker.workerShift] ?? worker.workerShift;
    final hasActive = activePolicy != null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primaryDark,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(
            right: -30,
            bottom: -30,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.08),
              ),
            ),
          ),
          Positioned(
            right: 20,
            bottom: -20,
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.06),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text(
                    'CURRENT COVER ID',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondary,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: onQuoteTap,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Quote!',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primaryDeep,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                displayId,
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              if (worker.workerZone.isNotEmpty) ...[
                RichText(
                  text: TextSpan(
                    style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                    children: [
                      const TextSpan(text: 'Zone: ', style: TextStyle(fontWeight: FontWeight.w600)),
                      TextSpan(text: worker.workerZone),
                    ],
                  ),
                ),
                const SizedBox(height: 2),
                if (shiftLabel.isNotEmpty)
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                      children: [
                        const TextSpan(text: 'Shift: ', style: TextStyle(fontWeight: FontWeight.w600)),
                        TextSpan(text: shiftLabel),
                      ],
                    ),
                  ),
                const SizedBox(height: 10),
              ],
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: hasActive
                      ? AppColors.successSurface
                      : AppColors.textPrimary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: hasActive ? AppColors.success : AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      hasActive ? 'Cover active' : 'No active cover',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: hasActive ? AppColors.success : AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Stat card ──────────────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;
  final String? sub;
  final Color? subColor;

  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    this.sub,
    this.subColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 16, color: iconColor),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
          ),
          if (sub != null) ...[
            const SizedBox(height: 1),
            Text(
              sub!,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: subColor ?? AppColors.textMuted,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
