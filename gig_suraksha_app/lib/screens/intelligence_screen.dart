import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../providers/claim_provider.dart';
import '../providers/policy_provider.dart';
import '../providers/worker_provider.dart';
import '../services/api_service.dart';
import '../widgets/common_widgets.dart';

class IntelligenceScreen extends StatefulWidget {
  const IntelligenceScreen({super.key});

  @override
  State<IntelligenceScreen> createState() => _IntelligenceScreenState();
}

class _IntelligenceScreenState extends State<IntelligenceScreen> {
  bool _loading = true;
  bool _monitorRunning = false;
  String? _error;
  Map<String, dynamic>? _summary;
  List<Map<String, dynamic>> _allClaims = const [];
  Map<String, dynamic>? _monitorResult;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final api = context.read<ApiService>();

    try {
      final results = await Future.wait([
        api.getAdminSummary(),
        api.getAllClaims(),
      ]);

      if (!mounted) {
        return;
      }

      setState(() {
        _summary = results[0] as Map<String, dynamic>;
        _allClaims = (results[1] as List<dynamic>).cast<Map<String, dynamic>>();
      });
    } catch (err) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error =
            'Live admin data is unavailable, showing local demo insights instead.';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _runMonitor() async {
    setState(() {
      _monitorRunning = true;
      _error = null;
    });

    try {
      final api = context.read<ApiService>();
      final result = await api.runTriggerMonitor();

      if (!mounted) {
        return;
      }

      setState(() => _monitorResult = result);
      await _load();
    } catch (err) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = 'Unable to run the automated trigger monitor right now.';
      });
    } finally {
      if (mounted) {
        setState(() => _monitorRunning = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final worker = context.watch<WorkerProvider>();
    final policyProv = context.watch<PolicyProvider>();
    final claimProv = context.watch<ClaimProvider>();
    final data =
        _summary ?? _buildFallbackSummary(worker, policyProv, claimProv);

    return Column(
      children: [
        _buildIntelHeader(),
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
              color: AppColors.primary,
              backgroundColor: AppColors.surface,
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 100),
                child: _loading && _summary == null
                    ? _buildLoadingView()
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHeroCard(
                            data,
                          ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.08),
                          const SizedBox(height: 20),
                          _buildStatsGrid(
                            data,
                          ).animate().fadeIn(delay: 80.ms, duration: 350.ms),
                          const SizedBox(height: 24),
                          if (_error != null)
                            GlassCard(
                              margin: const EdgeInsets.only(bottom: 18),
                              borderColor: AppColors.warning.withValues(alpha: 0.32),
                              padding: const EdgeInsets.all(16),
                              gradient: AppColors.cardGradientSoft,
                              child: Row(
                                children: [
                                  Container(
                                    width: 38,
                                    height: 38,
                                    decoration: BoxDecoration(
                                      color: AppColors.warning.withValues(alpha: 0.14),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: const Icon(
                                      Icons.wifi_tethering_error_rounded,
                                      color: AppColors.warning,
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      _error!,
                                      style: Theme.of(context).textTheme.bodySmall
                                          ?.copyWith(color: AppColors.textSecondary),
                                    ),
                                  ),
                                ],
                              ),
                            ).animate().fadeIn(delay: 140.ms, duration: 320.ms),
                          _buildAutomationCard().animate().fadeIn(
                            delay: 160.ms,
                            duration: 350.ms,
                          ),
                          const SizedBox(height: 24),
                          _buildMixCard(
                            data,
                          ).animate().fadeIn(delay: 220.ms, duration: 350.ms),
                          const SizedBox(height: 24),
                          _buildForecastSection(
                            data,
                          ).animate().fadeIn(delay: 300.ms, duration: 350.ms),
                          const SizedBox(height: 24),
                          _buildRecentClaimsSection(
                            data,
                          ).animate().fadeIn(delay: 380.ms, duration: 350.ms),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildIntelHeader() {
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Intelligence',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                          height: 1.2,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Portfolio · Fraud · Forecast',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                StatusChip(
                  label: _summary == null ? 'Fallback' : 'Live',
                  color: _summary == null ? AppColors.warning : AppColors.success,
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _load,
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.55),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.refresh_rounded,
                      size: 20,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroCard(Map<String, dynamic> data) {
    final totalPolicies = (data['total_active_policies'] as num?)?.toInt() ?? 0;
    final totalClaims = (data['total_claims'] as num?)?.toInt() ?? 0;
    final processedClaims = _allClaims
        .where((claim) => claim['payout_status'] == 'processed')
        .length;

    return GlassCard(
      showGlow: true,
      gradient: AppColors.signalGradient,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const EyebrowTag(
                label: 'Intelligence Center',
                icon: Icons.insights_rounded,
              ),
              const Spacer(),
              StatusChip(
                label: _summary == null ? 'Fallback Data' : 'Live Data',
                color: _summary == null ? AppColors.warning : AppColors.success,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Admin analytics, fraud posture, and trigger readiness in one mobile view.',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 10),
          Text(
            'Perfect for the final demo: show worker protection, insurer visibility, and automated event monitoring without leaving the app.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: _HeroSignal(
                  label: 'Active cover',
                  value: '$totalPolicies',
                  subtitle: 'insured portfolios',
                  color: AppColors.primaryLight,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _HeroSignal(
                  label: 'Claims',
                  value: '$totalClaims',
                  subtitle: '$processedClaims payouts processed',
                  color: AppColors.accent,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(Map<String, dynamic> data) {
    final totalPayouts = _allClaims.fold<double>(
      0,
      (sum, claim) =>
          sum +
          ((claim['payout_status'] == 'processed')
              ? ((claim['payout_amount'] as num?)?.toDouble() ?? 0)
              : 0),
    );

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: StatTile(
                icon: Icons.groups_rounded,
                iconColor: AppColors.primary,
                label: 'Workers',
                value: '${data['total_workers'] ?? 0}',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: StatTile(
                icon: Icons.shield_rounded,
                iconColor: AppColors.success,
                label: 'Policies',
                value: '${data['total_active_policies'] ?? 0}',
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: StatTile(
                icon: Icons.bolt_rounded,
                iconColor: AppColors.accent,
                label: 'Events',
                value: '${data['total_events'] ?? 0}',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: StatTile(
                icon: Icons.currency_rupee_rounded,
                iconColor: AppColors.info,
                label: 'Paid Out',
                value: '₹${totalPayouts.toStringAsFixed(0)}',
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAutomationCard() {
    return GlassCard(
      padding: const EdgeInsets.all(18),
      gradient: AppColors.cardGradientSoft,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: SectionHeader(
                  title: 'Trigger Automation',
                  subtitle:
                      'Run the backend monitor to scan policies and generate candidate events.',
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: _monitorRunning ? null : _runMonitor,
                icon: _monitorRunning
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.textOnPrimary,
                        ),
                      )
                    : const Icon(Icons.play_arrow_rounded, size: 18),
                label: Text(_monitorRunning ? 'Running' : 'Run'),
              ),
            ],
          ),
          if (_monitorResult != null) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _MonitorStat(
                    label: 'Policies scanned',
                    value: '${_monitorResult?['policies_scanned'] ?? 0}',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _MonitorStat(
                    label: 'Candidate events',
                    value:
                        '${(_monitorResult?['candidate_events'] as List<dynamic>?)?.length ?? 0}',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _MonitorStat(
                    label: 'Claims created',
                    value: '${_monitorResult?['claims_created'] ?? 0}',
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMixCard(Map<String, dynamic> data) {
    final byEventType =
        (data['claims_by_event_type'] as Map<String, dynamic>? ?? {}).entries
            .map(
              (entry) => (
                label: eventTypeLabels[entry.key] ?? entry.key,
                rawKey: entry.key,
                count: (entry.value as num?)?.toInt() ?? 0,
              ),
            )
            .toList()
          ..sort((left, right) => right.count.compareTo(left.count));

    final maxCount = byEventType.isEmpty ? 1 : byEventType.first.count;

    return GlassCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(
            title: 'Disruption Mix',
            subtitle:
                'What is currently driving claims across the insured portfolio.',
          ),
          if (byEventType.isEmpty)
            Text(
              'No live disruptions yet. Run a simulation or trigger monitor to populate this view.',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
            )
          else
            ...byEventType.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Row(
                  children: [
                    SizedBox(
                      width: 108,
                      child: Text(
                        item.label,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final barWidth = maxCount == 0
                              ? 0.0
                              : constraints.maxWidth *
                                    (item.count / math.max(maxCount, 1));

                          return Stack(
                            children: [
                              Container(
                                height: 12,
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceElevated,
                                  borderRadius: BorderRadius.circular(999),
                                ),
                              ),
                              Container(
                                width: barWidth,
                                height: 12,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      _eventColor(
                                        item.rawKey,
                                      ).withValues(alpha: 0.85),
                                      _eventColor(item.rawKey),
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      '${item.count}',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildForecastSection(Map<String, dynamic> data) {
    final forecastCards = _toMapList(data['forecast_cards']);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
          title: 'Next Week Forecast',
          subtitle:
              'Suggested premium and disruption risk for upcoming portfolio exposure.',
        ),
        if (forecastCards.isEmpty)
          const EmptyStateWidget(
            icon: Icons.show_chart_rounded,
            title: 'Forecast cards will appear here',
            subtitle:
                'Once the backend produces risk guidance, this area becomes a mobile-friendly insurer briefing.',
          )
        else
          ...forecastCards.map((card) {
            final riskBand = card['risk_band']?.toString() ?? 'MEDIUM';
            return GlassCard(
              padding: const EdgeInsets.all(18),
              margin: const EdgeInsets.only(bottom: 12),
              gradient: AppColors.cardGradientSoft,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${card['zone'] ?? 'Unknown Zone'}, ${card['city'] ?? 'Unknown City'}',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${shiftTypeLabels[card['shift_type']] ?? card['shift_type'] ?? 'Shift'} · ${coverageTierLabels[card['coverage_tier']] ?? card['coverage_tier'] ?? 'Coverage'}',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      RiskBadge(band: riskBand),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: _ForecastMetric(
                          label: 'Risk score',
                          value: '${card['risk_score'] ?? 0}',
                        ),
                      ),
                      Expanded(
                        child: _ForecastMetric(
                          label: 'Expected hours',
                          value:
                              '${((card['expected_disrupted_hours'] as num?)?.toDouble() ?? 0).toStringAsFixed(1)}h',
                        ),
                      ),
                      Expanded(
                        child: _ForecastMetric(
                          label: 'Suggested premium',
                          value: '₹${card['suggested_weekly_premium'] ?? '—'}',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Model: ${card['model_version'] ?? 'weekly-disruption-risk-v1'}',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _buildRecentClaimsSection(Map<String, dynamic> data) {
    final recentClaims = _toMapList(data['recent_claims']);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
          title: 'Fraud + Payout Snapshot',
          subtitle:
              'Recent claims with anomaly posture and payout processing state.',
        ),
        if (recentClaims.isEmpty)
          const EmptyStateWidget(
            icon: Icons.fact_check_rounded,
            title: 'No recent claims',
            subtitle:
                'Simulated disruptions will surface anomaly scores, validation checks, and payout status here.',
          )
        else
          ...recentClaims.take(4).map((claim) {
            final anomalyScore =
                ((claim['anomaly_score'] as num?)?.toDouble() ?? 0) * 100;
            final payoutStatus =
                claim['payout_status']?.toString() ?? 'pending';
            final createdAt = claim['created_at']?.toString();
            return GlassCard(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              eventTypeLabels[claim['event_type']] ??
                                  claim['event_type']?.toString() ??
                                  'Claim',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${claim['zone'] ?? 'Unknown zone'} · ${createdAt == null ? 'Recent' : DateFormat('d MMM, h:mm a').format(DateTime.tryParse(createdAt)?.toLocal() ?? DateTime.now())}',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      StatusChip(
                        label: payoutStatus.replaceAll('_', ' '),
                        color: payoutStatus == 'processed'
                            ? AppColors.success
                            : AppColors.warning,
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: _ForecastMetric(
                          label: 'Anomaly',
                          value: '${anomalyScore.toStringAsFixed(0)}%',
                        ),
                      ),
                      Expanded(
                        child: _ForecastMetric(
                          label: 'Payout',
                          value:
                              '₹${((claim['payout_amount'] as num?)?.toDouble() ?? 0).toStringAsFixed(0)}',
                        ),
                      ),
                      Expanded(
                        child: _ForecastMetric(
                          label: 'Checks',
                          value:
                              '${(claim['validation_checks'] as Map<String, dynamic>? ?? {}).values.where((value) => value == true).length}/7',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _buildLoadingView() {
    return Column(
      children: const [
        ShimmerBlock(
          height: 210,
          borderRadius: BorderRadius.all(Radius.circular(28)),
        ),
        SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: ShimmerBlock(height: 132)),
            SizedBox(width: 10),
            Expanded(child: ShimmerBlock(height: 132)),
          ],
        ),
        SizedBox(height: 10),
        Row(
          children: [
            Expanded(child: ShimmerBlock(height: 132)),
            SizedBox(width: 10),
            Expanded(child: ShimmerBlock(height: 132)),
          ],
        ),
        SizedBox(height: 18),
        ShimmerBlock(
          height: 168,
          borderRadius: BorderRadius.all(Radius.circular(24)),
        ),
        SizedBox(height: 18),
        ShimmerBlock(
          height: 220,
          borderRadius: BorderRadius.all(Radius.circular(24)),
        ),
      ],
    );
  }

  Map<String, dynamic> _buildFallbackSummary(
    WorkerProvider worker,
    PolicyProvider policyProv,
    ClaimProvider claimProv,
  ) {
    final activePolicy = policyProv.activePolicy;
    final claims = claimProv.claims;
    final claimsByStatus = <String, int>{};
    final claimsByEventType = <String, int>{};

    for (final claim in claims) {
      final status = claim['status']?.toString() ?? 'unknown';
      claimsByStatus[status] = (claimsByStatus[status] ?? 0) + 1;

      final eventType = claim['event_type']?.toString() ?? 'unknown';
      claimsByEventType[eventType] = (claimsByEventType[eventType] ?? 0) + 1;
    }

    final risk = activePolicy?['risk_summary'] as Map<String, dynamic>? ?? {};
    final premium =
        activePolicy?['premium_breakdown'] as Map<String, dynamic>? ?? {};

    return {
      'total_workers': worker.isRegistered ? 1 : 0,
      'total_active_policies': activePolicy == null ? 0 : 1,
      'total_events': claims.length,
      'total_claims': claims.length,
      'claims_by_status': claimsByStatus,
      'claims_by_event_type': claimsByEventType,
      'recent_claims': claims,
      'forecast_cards': [
        {
          'city': worker.workerCity,
          'zone': worker.workerZone,
          'shift_type': worker.workerShift,
          'coverage_tier': activePolicy?['coverage_tier'] ?? 'standard',
          'risk_band': risk['risk_band'] ?? 'MEDIUM',
          'risk_score': risk['risk_score'] ?? 48,
          'expected_disrupted_hours': risk['expected_disrupted_hours'] ?? 2.1,
          'suggested_weekly_premium': premium['final_weekly_premium'] ?? 52,
          'model_version': 'weekly-disruption-risk-v1',
        },
      ],
    };
  }

  List<Map<String, dynamic>> _toMapList(dynamic value) {
    if (value is List<dynamic>) {
      return value.whereType<Map<String, dynamic>>().toList();
    }
    return const [];
  }

  Color _eventColor(String eventType) {
    switch (eventType) {
      case 'heavy_rainfall':
        return AppColors.rainColor;
      case 'waterlogging':
        return AppColors.floodColor;
      case 'heat_stress':
        return AppColors.heatColor;
      case 'severe_aqi':
        return AppColors.aqiColor;
      case 'platform_outage':
        return AppColors.outageColor;
      case 'dark_store_unavailable':
        return AppColors.storeColor;
      case 'zone_access_restriction':
        return AppColors.accessColor;
      default:
        return AppColors.primary;
    }
  }
}

class _HeroSignal extends StatelessWidget {
  final String label;
  final String value;
  final String subtitle;
  final Color color;

  const _HeroSignal({
    required this.label,
    required this.value,
    required this.subtitle,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
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
          Text(
            label.toUpperCase(),
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: color),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontSize: 24),
          ),
          const SizedBox(height: 4),
          Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _MonitorStat extends StatelessWidget {
  final String label;
  final String value;

  const _MonitorStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 6),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}

class _ForecastMetric extends StatelessWidget {
  final String label;
  final String value;

  const _ForecastMetric({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: Theme.of(context).textTheme.labelSmall,
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(
            context,
          ).textTheme.titleSmall?.copyWith(color: AppColors.textPrimary),
        ),
      ],
    );
  }
}
