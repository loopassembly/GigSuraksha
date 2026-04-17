import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../providers/verification_provider.dart';
import '../providers/worker_provider.dart';
import '../services/telemetry_service.dart';
import '../widgets/common_widgets.dart';
import 'home_shell.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pageController = PageController();
  int _currentStep = 0;
  final _totalSteps = 4;

  // Step 1
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  String _selectedCity = '';
  String _selectedPlatform = '';

  // Step 2
  String _selectedZoneId = '';
  String _selectedShiftId = '';
  final _earningsCtrl = TextEditingController();
  final _hoursCtrl = TextEditingController();

  // Step 3
  final _upiCtrl = TextEditingController();
  String _selectedTier = 'standard';

  // Step 4
  final Map<String, Map<String, dynamic>?> _kycShots = {
    'front': null,
    'left': null,
    'right': null,
  };

  @override
  void dispose() {
    _pageController.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _earningsCtrl.dispose();
    _hoursCtrl.dispose();
    _upiCtrl.dispose();
    super.dispose();
  }

  bool _canProceed() {
    switch (_currentStep) {
      case 0:
        return _nameCtrl.text.trim().length >= 2 &&
            _phoneCtrl.text.trim().length >= 8 &&
            _selectedCity.isNotEmpty &&
            _selectedPlatform.isNotEmpty;
      case 1:
        return _selectedZoneId.isNotEmpty &&
            _selectedShiftId.isNotEmpty &&
            _earningsCtrl.text.isNotEmpty &&
            _hoursCtrl.text.isNotEmpty;
      case 2:
        return _upiCtrl.text.trim().length >= 3;
      case 3:
        return _kycShots.values.every((shot) => shot != null);
      default:
        return false;
    }
  }

  void _goNext() {
    HapticFeedback.lightImpact();
    if (_currentStep < _totalSteps - 1) {
      setState(() => _currentStep++);
      _pageController.animateToPage(
        _currentStep,
        duration: 280.ms,
        curve: Curves.easeOutCubic,
      );
    } else {
      _submit();
    }
  }

  void _goBack() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.animateToPage(
        _currentStep,
        duration: 280.ms,
        curve: Curves.easeOutCubic,
      );
    }
  }

  Future<void> _submit() async {
    final zone = allZones.firstWhere((z) => z.id == _selectedZoneId);
    final shift = shiftWindows.firstWhere((s) => s.id == _selectedShiftId);

    final provider = context.read<WorkerProvider>();
    final telemetry = context.read<TelemetryService>();
    final verification = context.read<VerificationProvider>();
    final success = await provider.registerWorker(
      name: _nameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      city: zone.backendCity ?? zone.city,
      platform: _selectedPlatform,
      zone: zone.name,
      shiftType: shift.backendType,
      weeklyEarnings: double.tryParse(_earningsCtrl.text) ?? 0,
      weeklyActiveHours: double.tryParse(_hoursCtrl.text) ?? 0,
      upiId: _upiCtrl.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      await verification.saveKycProfile(
        workerId: provider.workerId ?? 'pending',
        workerName: provider.workerName,
        phone: provider.workerPhone,
        city: provider.workerCity,
        zone: provider.workerZone,
        frontAngle: _kycShots['front']!,
        leftAngle: _kycShots['left']!,
        rightAngle: _kycShots['right']!,
      );
      await telemetry.setWorkerContext(
        workerId: provider.workerId,
        city: provider.workerCity,
        zone: provider.workerZone,
        platform: provider.workerPlatform,
        shiftType: provider.workerShift,
      );
      await telemetry.logOnboardingCompleted(
        city: provider.workerCity,
        zone: provider.workerZone,
        platform: provider.workerPlatform,
      );
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const HomeShell()),
        (_) => false,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Registration failed'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final worker = context.watch<WorkerProvider>();
    final valid = _canProceed();
    final isLastStep = _currentStep == _totalSteps - 1;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, size: 20),
          onPressed: _currentStep > 0 ? _goBack : () => Navigator.pop(context),
        ),
        title: const Text(
          'Registration',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                '${_currentStep + 1}/$_totalSteps',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryDark,
                ),
              ),
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(3),
          child: _ProgressBar(step: _currentStep + 1, total: _totalSteps),
        ),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              // Step header
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                child: _StepHeaderCard(step: _currentStep),
              ),

              // Pages
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _step1Personal(),
                    _step2Work(),
                    _step3Payment(),
                    _step4Kyc(),
                  ],
                ),
              ),

              // Bottom CTA
              Container(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
                color: AppColors.surface,
                child: SafeArea(
                  top: false,
                  child: isLastStep
                      ? SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: valid ? _goNext : null,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              backgroundColor: valid
                                  ? AppColors.textPrimary
                                  : AppColors.backgroundDeep,
                              foregroundColor: valid
                                  ? Colors.white
                                  : AppColors.textMuted,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: const Text(
                              'Complete Registration',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        )
                      : Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Align(
                            alignment: Alignment.center,
                            child: GestureDetector(
                              onTap: valid ? _goNext : null,
                              child: AnimatedContainer(
                                duration: 200.ms,
                                width: 52,
                                height: 52,
                                decoration: BoxDecoration(
                                  color: valid
                                      ? AppColors.textPrimary
                                      : AppColors.backgroundDeep,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.arrow_forward_rounded,
                                  color: valid
                                      ? Colors.white
                                      : AppColors.textMuted,
                                  size: 22,
                                ),
                              ),
                            ),
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
          if (worker.loading)
            const LoadingOverlay(visible: true, message: 'Registering…'),
        ],
      ),
    );
  }

  // ── Step 1: Personal ────────────────────────────────────────
  Widget _step1Personal() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _fieldLabel('Full Name'),
          _DarkTextField(
            controller: _nameCtrl,
            hint: 'Enter your name',
            onChanged: (_) => setState(() {}),
            capitalization: TextCapitalization.words,
          ),

          const SizedBox(height: 14),
          _fieldLabel('Phone Number'),
          _DarkTextField(
            controller: _phoneCtrl,
            hint: '6205840930',
            prefix: '+91  ',
            onChanged: (_) => setState(() {}),
            keyboardType: TextInputType.phone,
            formatters: [FilteringTextInputFormatter.digitsOnly],
          ),

          const SizedBox(height: 14),
          _fieldLabel('City'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: supportedCities.map((city) {
              final sel = _selectedCity == city;
              return _SelectChip(
                label: city,
                selected: sel,
                onTap: () => setState(() {
                  _selectedCity = sel ? '' : city;
                  _selectedZoneId = '';
                }),
              );
            }).toList(),
          ),

          const SizedBox(height: 14),
          _fieldLabel('Platform'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: supportedPlatforms.map((p) {
              final sel = _selectedPlatform == p;
              return _SelectChip(
                label: p,
                selected: sel,
                onTap: () => setState(() => _selectedPlatform = sel ? '' : p),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ── Step 2: Work ────────────────────────────────────────────
  Widget _step2Work() {
    final zones = _selectedCity.isNotEmpty
        ? zonesForCity(_selectedCity)
        : <ZoneInfo>[];

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _fieldLabel('Operating Zone'),
          if (zones.isEmpty)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.warningSurface,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    size: 16,
                    color: AppColors.warningDark,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Select a city first to see available zones',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.warningDark,
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: zones.map((zone) {
                final sel = _selectedZoneId == zone.id;
                return _SelectChip(
                  label: zone.name,
                  selected: sel,
                  onTap: () =>
                      setState(() => _selectedZoneId = sel ? '' : zone.id),
                );
              }).toList(),
            ),

          const SizedBox(height: 18),
          _fieldLabel('Primary Shift'),
          ...shiftWindows.map((shift) {
            final sel = _selectedShiftId == shift.id;
            final subtitle = _shiftSubtitle(shift.id);
            return GestureDetector(
              onTap: () => setState(() => _selectedShiftId = shift.id),
              child: AnimatedContainer(
                duration: 180.ms,
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: sel ? AppColors.primaryFaint : AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: sel ? AppColors.primaryDark : AppColors.border,
                    width: sel ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: sel
                            ? AppColors.primaryDark
                            : AppColors.backgroundDeep,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.schedule_rounded,
                        size: 16,
                        color: sel
                            ? AppColors.textPrimary
                            : AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            shift.label,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: sel
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: sel
                                  ? AppColors.textPrimary
                                  : AppColors.textSecondary,
                            ),
                          ),
                          if (sel && subtitle != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              subtitle,
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (sel)
                      Container(
                        width: 22,
                        height: 22,
                        decoration: const BoxDecoration(
                          color: AppColors.primaryDark,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check_rounded,
                          size: 13,
                          color: Colors.white,
                        ),
                      ),
                  ],
                ),
              ),
            );
          }),

          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Weekly Earnings (₹)'),
                    _DarkTextField(
                      controller: _earningsCtrl,
                      hint: '6000',
                      onChanged: (_) => setState(() {}),
                      keyboardType: TextInputType.number,
                      formatters: [FilteringTextInputFormatter.digitsOnly],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Hours/Week'),
                    _DarkTextField(
                      controller: _hoursCtrl,
                      hint: '40',
                      onChanged: (_) => setState(() {}),
                      keyboardType: TextInputType.number,
                      formatters: [FilteringTextInputFormatter.digitsOnly],
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

  String? _shiftSubtitle(String id) {
    switch (id) {
      case 'morning':
        return 'High demand · Best earnings';
      case 'evening':
        return 'Peak hours · Surge pricing';
      case 'afternoon':
        return 'Steady flow · Low traffic';
      case 'night':
        return 'Low volume · Night bonus';
      default:
        return null;
    }
  }

  // ── Step 3: Payment ─────────────────────────────────────────
  Widget _step3Payment() {
    final upiFilled = _upiCtrl.text.trim().length >= 3;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _fieldLabel('UPI ID'),
          _DarkTextField(
            controller: _upiCtrl,
            hint: 'name@upi',
            onChanged: (_) => setState(() {}),
          ),
          if (upiFilled) ...[
            const SizedBox(height: 6),
            Row(
              children: const [
                Icon(
                  Icons.check_circle_rounded,
                  size: 14,
                  color: AppColors.success,
                ),
                SizedBox(width: 5),
                Text(
                  'UPI ID verified',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.success,
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 20),
          _fieldLabel('Coverage Tier'),

          ...coverageTiers.map((tier) {
            final sel = _selectedTier == tier.id;
            final IconData icon = tier.id == 'basic'
                ? Icons.shield_outlined
                : tier.id == 'standard'
                ? Icons.shield_rounded
                : Icons.workspace_premium_rounded;
            return GestureDetector(
              onTap: () => setState(() => _selectedTier = tier.id),
              child: AnimatedContainer(
                duration: 180.ms,
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: sel ? AppColors.primaryFaint : AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: sel ? AppColors.primaryDark : AppColors.border,
                    width: sel ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: sel
                            ? AppColors.primaryDark
                            : AppColors.backgroundDeep,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        icon,
                        size: 20,
                        color: sel
                            ? AppColors.textPrimary
                            : AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                tier.name,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: sel
                                      ? AppColors.textPrimary
                                      : AppColors.textSecondary,
                                ),
                              ),
                              if (tier.id == 'standard') ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryDark,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text(
                                    'RECOMMENDED',
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${tier.coveragePercent}% coverage · Max ₹${tier.maxWeeklyPayout}/week',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (sel)
                      Container(
                        width: 22,
                        height: 22,
                        decoration: const BoxDecoration(
                          color: AppColors.primaryDark,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check_rounded,
                          size: 13,
                          color: Colors.white,
                        ),
                      ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  // ── Step 4: KYC ─────────────────────────────────────────────
  Widget _step4Kyc() {
    final verification = context.watch<VerificationProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Trust layer info card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primaryFaint,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppColors.primaryDark.withValues(alpha: 0.4),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.accentFaint,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: AppColors.accent.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.circle, size: 7, color: AppColors.accent),
                      SizedBox(width: 5),
                      Text(
                        'TRUST LAYER',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.accent,
                          letterSpacing: 0.6,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Capture three selfie angles to prove a real delivery partner is creating this account.',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Images are stored on-device for demo purposes and power duplicate-account checks, selfie spoofing resistance, and stronger fraud controls during claims.',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.primaryDeep,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // KYC angle cards
          ...kycAngleLabels.keys.map((angle) {
            final shot = _kycShots[angle];
            final captured = shot != null;
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image or placeholder
                  GestureDetector(
                    onTap: verification.busy
                        ? null
                        : () => _captureKycAngle(angle),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: 72,
                        height: 72,
                        color: AppColors.primaryFaint,
                        child: captured
                            ? Image.file(
                                File(shot['path'].toString()),
                                fit: BoxFit.cover,
                              )
                            : const Icon(
                                Icons.camera_alt_rounded,
                                size: 28,
                                color: AppColors.primaryDark,
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
                          kycAngleLabels[angle] ?? angle,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          kycAngleHelp[angle] ?? '',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(
                              captured
                                  ? Icons.check_circle_rounded
                                  : Icons.crop_free_rounded,
                              size: 18,
                              color: captured
                                  ? AppColors.success
                                  : AppColors.textMuted,
                            ),
                            if (captured) ...[
                              const SizedBox(width: 4),
                              GestureDetector(
                                onTap: () => _captureKycAngle(angle),
                                child: const Text(
                                  'Retake',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppColors.primaryDark,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),

          if (verification.error != null) ...[
            const SizedBox(height: 8),
            Text(
              verification.error!,
              style: const TextStyle(fontSize: 12, color: AppColors.error),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _captureKycAngle(String angle) async {
    final verification = context.read<VerificationProvider>();
    final shot = await verification.captureKycAngle(angle: angle);
    if (!mounted || shot == null) return;
    setState(() => _kycShots[angle] = shot);
  }

  Widget _fieldLabel(String text) {
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
}

// ── Progress bar ───────────────────────────────────────────────
class _ProgressBar extends StatelessWidget {
  final int step;
  final int total;
  const _ProgressBar({required this.step, required this.total});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          children: [
            Container(
              height: 3,
              width: constraints.maxWidth,
              color: AppColors.backgroundDeep,
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              height: 3,
              width: constraints.maxWidth * (step / total),
              color: AppColors.primaryDark,
            ),
          ],
        );
      },
    );
  }
}

// ── Step header card ───────────────────────────────────────────
class _StepHeaderCard extends StatelessWidget {
  final int step;
  const _StepHeaderCard({required this.step});

  (String, String, IconData) get _meta {
    switch (step) {
      case 0:
        return (
          'Personal details',
          'Name, phone, city & platform',
          Icons.accessibility_new_rounded,
        );
      case 1:
        return (
          'Work details',
          'Zone, shift & earnings info',
          Icons.lock_outline_rounded,
        );
      case 2:
        return (
          'Payment setup',
          'UPI and coverage preference',
          Icons.credit_card_rounded,
        );
      default:
        return (
          'Face verification',
          'Three-angle selfie KYC',
          Icons.verified_user_outlined,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final (title, subtitle, icon) = _meta;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: AppColors.primaryDark.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.primaryDark,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 20, color: AppColors.textPrimary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Text field ─────────────────────────────────────────────────
class _DarkTextField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final String? prefix;
  final ValueChanged<String>? onChanged;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? formatters;
  final TextCapitalization capitalization;

  const _DarkTextField({
    required this.controller,
    required this.hint,
    this.prefix,
    this.onChanged,
    this.keyboardType,
    this.formatters,
    this.capitalization = TextCapitalization.none,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      keyboardType: keyboardType,
      inputFormatters: formatters,
      textCapitalization: capitalization,
      style: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 15,
        fontWeight: FontWeight.w500,
      ),
      decoration: InputDecoration(
        hintText: hint,
        prefixText: prefix,
        prefixStyle: const TextStyle(
          color: AppColors.textSecondary,
          fontSize: 15,
        ),
        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 15),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppColors.primaryDark,
            width: 1.5,
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
    );
  }
}

// ── Select chip ────────────────────────────────────────────────
class _SelectChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _SelectChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: 160.ms,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryDark : AppColors.surface,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: selected ? AppColors.primaryDark : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (selected) ...[
              Container(
                width: 16,
                height: 16,
                decoration: const BoxDecoration(
                  color: AppColors.textPrimary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_rounded,
                  size: 10,
                  color: AppColors.primaryDark,
                ),
              ),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected
                    ? AppColors.textPrimary
                    : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
