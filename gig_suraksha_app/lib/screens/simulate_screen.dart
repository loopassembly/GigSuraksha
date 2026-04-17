import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../providers/claim_provider.dart';
import '../providers/verification_provider.dart';
import '../providers/worker_provider.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../widgets/common_widgets.dart';

class SimulateScreen extends StatefulWidget {
  const SimulateScreen({super.key});

  @override
  State<SimulateScreen> createState() => _SimulateScreenState();
}

class _SimulateScreenState extends State<SimulateScreen> {
  final LocationService _locationService = LocationService();
  final TextEditingController _notesController = TextEditingController();

  String _selectedEvent = 'heavy_rainfall';
  String _selectedSeverity = 'moderate';
  double _duration = 2.0;
  String _evidenceMode = 'on_site';
  String _safeOverrideReason = safeOverrideReasons.first;
  bool _loading = false;
  Map<String, dynamic>? _result;
  Map<String, dynamic>? _evidencePacket;
  Map<String, dynamic>? _evidencePhoto;
  Position? _evidencePosition;
  String? _errorMsg;

  @override
  void dispose() {
    _notesController.dispose();
    _locationService.dispose();
    super.dispose();
  }

  Future<void> _captureEvidencePhoto() async {
    final verification = context.read<VerificationProvider>();
    final photo = await verification.captureClaimEvidencePhoto(
      mode: _evidenceMode,
    );

    if (!mounted || photo == null) {
      return;
    }

    final position = await _locationService.getCurrentPosition();
    if (!mounted) {
      return;
    }

    setState(() {
      _evidencePhoto = photo;
      _evidencePosition = position;
    });
  }

  Future<void> _run() async {
    final worker = context.read<WorkerProvider>();
    final verification = context.read<VerificationProvider>();
    final api = context.read<ApiService>();
    final claimProvider = context.read<ClaimProvider>();

    if (_evidencePhoto == null) {
      setState(() {
        _errorMsg =
            'Capture a photo first so the claim has worker-supplied proof.';
      });
      return;
    }

    setState(() {
      _loading = true;
      _result = null;
      _evidencePacket = null;
      _errorMsg = null;
    });

    try {
      final res = await api.simulateEvent(
        eventType: _selectedEvent,
        city: worker.workerCity,
        zone: worker.workerZone,
        severity: _selectedSeverity,
        startTime: DateTime.now().toUtc().toIso8601String(),
        durationHours: _duration,
      );

      final claims = (res['claims'] as List<dynamic>? ?? [])
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
      final claimIds = claims
          .map(_claimIdOf)
          .whereType<String>()
          .where((id) => id.isNotEmpty)
          .toList();

      Map<String, dynamic>? evidencePacket;
      if (claimIds.isNotEmpty && worker.workerId != null) {
        evidencePacket = await verification.attachEvidenceToClaims(
          claimIds: claimIds,
          workerId: worker.workerId!,
          eventType: _selectedEvent,
          zone: worker.workerZone,
          city: worker.workerCity,
          mode: _evidenceMode,
          photo: _evidencePhoto!,
          locationSnapshot: _locationSnapshot(_evidencePosition),
          reason: _evidenceMode == 'remote_override'
              ? _safeOverrideReason
              : null,
          notes: _notesController.text,
        );
      }

      if (worker.workerId != null) {
        await claimProvider.fetchWorkerClaims(worker.workerId!);
      }

      setState(() {
        _result = res;
        _evidencePacket = evidencePacket;
        _loading = false;
      });
    } catch (err) {
      setState(() {
        _errorMsg = err.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final verification = context.watch<VerificationProvider>();

    return Column(
      children: [
        _buildSimulateHeader(),
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
          GlassCard(
            padding: const EdgeInsets.all(14),
            gradient: AppColors.signalGradient,
            child: Row(
              children: [
                const Icon(
                  Icons.fact_check_rounded,
                  size: 18,
                  color: AppColors.primaryLight,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Phase 3 claim initiation now requires worker evidence. Capture the disruption scene if reachable, or use a safety override with blocked-access proof when the zone is unsafe.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.45,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          _label('Event Type'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: eventTypes.map((type) {
              final selected = _selectedEvent == type;
              return ChoiceChip(
                label: Text(eventTypeLabels[type] ?? type),
                selected: selected,
                onSelected: (_) => setState(() => _selectedEvent = type),
                selectedColor: AppColors.primarySurface,
                avatar: selected
                    ? null
                    : Icon(
                        _eventIcon(type),
                        size: 14,
                        color: _eventColor(type),
                      ),
                labelStyle: TextStyle(
                  fontSize: 13,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                  color: selected
                      ? AppColors.primaryLight
                      : AppColors.textSecondary,
                ),
                side: BorderSide(
                  color: selected
                      ? AppColors.primary.withValues(alpha: 0.3)
                      : AppColors.border,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),
          _label('Severity'),
          Row(
            children: severityLevels.map((sev) {
              final selected = _selectedSeverity == sev;
              final sevColor = _severityColor(sev);
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedSeverity = sev),
                  child: Container(
                    margin: EdgeInsets.only(right: sev != 'severe' ? 6 : 0),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: selected
                          ? sevColor.withValues(alpha: 0.08)
                          : AppColors.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: selected
                            ? sevColor.withValues(alpha: 0.3)
                            : AppColors.border,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        sev.toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: selected ? sevColor : AppColors.textMuted,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),
          _label('Duration: ${_duration.toStringAsFixed(1)} hours'),
          SliderTheme(
            data: SliderThemeData(
              activeTrackColor: AppColors.primary,
              inactiveTrackColor: AppColors.backgroundDeep,
              thumbColor: AppColors.primary,
              overlayColor: AppColors.primary.withValues(alpha: 0.1),
              trackHeight: 4,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
            ),
            child: Slider(
              value: _duration,
              min: 0.5,
              max: 8.0,
              divisions: 15,
              onChanged: (val) => setState(() => _duration = val),
            ),
          ),
          const SizedBox(height: 20),
          const SectionHeader(
            title: 'Worker Evidence',
            subtitle:
                'The app now captures worker-supplied proof before the claim enters ML validation.',
          ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: claimEvidenceModes.map((mode) {
              final selected = _evidenceMode == mode;
              return ChoiceChip(
                label: Text(claimEvidenceModeLabels[mode] ?? mode),
                selected: selected,
                onSelected: (_) => setState(() => _evidenceMode = mode),
                selectedColor: AppColors.primarySurface,
                labelStyle: TextStyle(
                  fontSize: 12,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected
                      ? AppColors.primaryLight
                      : AppColors.textSecondary,
                ),
                side: BorderSide(
                  color: selected
                      ? AppColors.primary.withValues(alpha: 0.3)
                      : AppColors.border,
                ),
              );
            }).toList(),
          ),
          if (_evidenceMode == 'remote_override') ...[
            const SizedBox(height: 14),
            GlassCard(
              padding: const EdgeInsets.all(16),
              borderColor: AppColors.warning.withValues(alpha: 0.28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Safety Override',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Use this when floodwater, barricades, or other unsafe conditions prevent the worker from reaching the exact disruption location. Capture a safe-boundary or blocked-route image instead, and let the ML + parametric trigger data fill the reachability gap.',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: safeOverrideReasons.map((reason) {
                      final selected = _safeOverrideReason == reason;
                      return ChoiceChip(
                        label: Text(reason),
                        selected: selected,
                        onSelected: (_) =>
                            setState(() => _safeOverrideReason = reason),
                        selectedColor: AppColors.warning.withValues(
                          alpha: 0.16,
                        ),
                        labelStyle: TextStyle(
                          fontSize: 11,
                          fontWeight: selected
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: selected
                              ? AppColors.warning
                              : AppColors.textSecondary,
                        ),
                        side: BorderSide(
                          color: selected
                              ? AppColors.warning.withValues(alpha: 0.3)
                              : AppColors.border,
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: 110,
                    height: 110,
                    color: AppColors.surfaceElevated,
                    child: _evidencePhoto != null
                        ? Image.file(
                            File(_evidencePhoto!['path'].toString()),
                            fit: BoxFit.cover,
                          )
                        : const Icon(
                            Icons.camera_alt_rounded,
                            color: AppColors.textMuted,
                            size: 28,
                          ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _evidenceMode == 'remote_override'
                            ? 'Capture blocked-route or safe-boundary proof'
                            : 'Capture the disruption surroundings',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _evidenceMode == 'remote_override'
                            ? 'This image proves the worker tried to approach the area but stopped at a safe point.'
                            : 'This image shows the worker-provided disruption context that feeds fraud checks.',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: verification.busy || _loading
                                ? null
                                : _captureEvidencePhoto,
                            icon: Icon(
                              _evidencePhoto == null
                                  ? Icons.camera_alt_rounded
                                  : Icons.refresh_rounded,
                            ),
                            label: Text(
                              _evidencePhoto == null ? 'Capture' : 'Retake',
                            ),
                          ),
                          if (_evidencePhoto != null)
                            StatusChip(
                              label: _evidenceMode == 'remote_override'
                                  ? 'SAFE OVERRIDE'
                                  : 'ON-SITE PROOF',
                              color: _evidenceMode == 'remote_override'
                                  ? AppColors.warning
                                  : AppColors.success,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _notesController,
            minLines: 2,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: _evidenceMode == 'remote_override'
                  ? 'Optional: add what blocked access, water level, police warning, or route problem'
                  : 'Optional: add what the worker saw on-ground',
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: StatTile(
                  icon: Icons.my_location_rounded,
                  iconColor: AppColors.primary,
                  label: 'GPS',
                  value: _evidencePosition != null ? 'Attached' : 'Pending',
                  subValue: _evidencePosition != null
                      ? '±${_evidencePosition!.accuracy.toStringAsFixed(0)}m'
                      : 'captured at claim time',
                  subValueColor: AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StatTile(
                  icon: Icons.verified_user_rounded,
                  iconColor: AppColors.accent,
                  label: 'KYC',
                  value: verification.isKycVerified ? 'Verified' : 'Missing',
                  subValue: verification.isKycVerified
                      ? '3-angle selfie passed'
                      : 'lower trust score',
                  subValueColor: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _loading || _evidencePhoto == null ? null : _run,
              icon: _loading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.textOnPrimary,
                      ),
                    )
                  : const Icon(Icons.fact_check_rounded, size: 20),
              label: Text(
                _loading ? 'Submitting…' : 'Submit Evidence & Trigger Claim',
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          if (_errorMsg != null) ...[
            const SizedBox(height: 14),
            GlassCard(
              padding: const EdgeInsets.all(12),
              borderColor: AppColors.error.withValues(alpha: 0.2),
              child: Row(
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    color: AppColors.error,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMsg!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.error,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (_result != null) ...[
            const SizedBox(height: 20),
            _buildResult(_result!),
          ],
        ],
      ),
    ),
          ),
        ),
      ],
    );
  }

  Widget _buildSimulateHeader() {
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
                        'Simulate',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                          height: 1.2,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Trigger disruption events & claims',
                        style: TextStyle(
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
                    Icons.bolt_rounded,
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

  Widget _buildResult(Map<String, dynamic> result) {
    final event = result['event'] as Map<String, dynamic>? ?? {};
    final claims = result['claims'] as List<dynamic>? ?? [];
    final claimsCount = result['claims_created'] as int? ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Result'),
        GlassCard(
          showGlow: true,
          padding: const EdgeInsets.all(16),
          borderColor: AppColors.success.withValues(alpha: 0.24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.check_circle_rounded,
                    size: 18,
                    color: AppColors.success,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Event triggered — $claimsCount claim${claimsCount == 1 ? '' : 's'} created',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.success,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${eventTypeLabels[event['event_type']] ?? ''} · ${event['severity']?.toString().toUpperCase() ?? ''}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              if (_evidencePacket != null) ...[
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    SignalPill(
                      icon: Icons.camera_alt_rounded,
                      label:
                          _evidencePacket!['mode_label']?.toString() ??
                          'Evidence attached',
                      color: AppColors.accent,
                    ),
                    SignalPill(
                      icon: Icons.verified_user_rounded,
                      label:
                          'Trust ${(((_evidencePacket!['trust_score'] as num?)?.toDouble() ?? 0) * 100).toStringAsFixed(0)}%',
                      color: AppColors.primaryLight,
                    ),
                    if (_evidencePacket!['safe_override'] == true)
                      const SignalPill(
                        icon: Icons.warning_amber_rounded,
                        label: 'Safety override used',
                        color: AppColors.warning,
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  _evidencePacket!['status_line']?.toString() ?? '',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    height: 1.45,
                  ),
                ),
              ],
              if (claims.isNotEmpty) ...[
                const Divider(height: 18),
                ...claims.map((c) {
                  final cl = c as Map<String, dynamic>;
                  final claimId = _claimIdOf(cl) ?? '—';
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.receipt_outlined,
                          size: 14,
                          color: AppColors.textMuted,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Claim #${claimId.length > 8 ? claimId.substring(0, 8) : claimId}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                        Text(
                          '₹${(cl['payout_amount'] as num?)?.toStringAsFixed(0) ?? '—'}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.success,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ],
          ),
        ).animate().fadeIn(duration: 300.ms),
      ],
    );
  }

  Map<String, dynamic>? _locationSnapshot(Position? position) {
    if (position == null) {
      return null;
    }
    return {
      'lat': position.latitude,
      'lng': position.longitude,
      'accuracy': position.accuracy,
      'captured_at': DateTime.now().toIso8601String(),
    };
  }

  String? _claimIdOf(Map<String, dynamic> claim) {
    return claim['claim_id']?.toString() ?? claim['id']?.toString();
  }

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),
    );
  }

  Color _severityColor(String sev) => switch (sev) {
    'low' => AppColors.success,
    'moderate' => AppColors.warning,
    'high' => const Color(0xFFEA580C),
    'severe' => AppColors.error,
    _ => AppColors.textMuted,
  };

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
