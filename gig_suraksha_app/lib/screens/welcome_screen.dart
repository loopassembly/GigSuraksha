import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import 'onboarding_screen.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _HeroSection(),
                const SizedBox(height: 28),
                _HowItWorksSection(),
                const SizedBox(height: 20),
                _TrustStatsRow(),
                const SizedBox(height: 100),
              ],
            ),
          ),
          // Arrow FAB + tagline pinned at bottom
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _BottomCta(
              onTap: () => Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const OnboardingScreen()),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Hero ───────────────────────────────────────────────────────
class _HeroSection extends StatelessWidget {
  const _HeroSection();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.primary,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top bar: logo pill + bell
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _LogoPill().animate().fadeIn(duration: 300.ms),
                      _BellButton().animate().fadeIn(duration: 300.ms),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Headline
                  const Text(
                    'Income\nProtection,\nSmarter\nGig Work',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      height: 1.1,
                      letterSpacing: -0.5,
                    ),
                  ).animate().fadeIn(delay: 80.ms, duration: 350.ms),
                  const SizedBox(height: 12),
                  const Text(
                    'Rain, heat, or outages stop your\ndeliveries — we pay you automatically.',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                      height: 1.45,
                    ),
                  ).animate().fadeIn(delay: 160.ms, duration: 350.ms),
                  const SizedBox(height: 20),
                  // Price card
                  _ActiveProtectionCard().animate().fadeIn(
                    delay: 240.ms,
                    duration: 350.ms,
                  ),
                  const SizedBox(height: 0),
                ],
              ),
            ),
          ),
          // Wave clip
          const _WaveDivider(),
        ],
      ),
    );
  }
}

class _LogoPill extends StatelessWidget {
  const _LogoPill();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.60),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: AppColors.textPrimary,
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Icon(
              Icons.location_on_rounded,
              size: 13,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 6),
          const Text(
            'GigSuraksha',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _BellButton extends StatelessWidget {
  const _BellButton();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.60),
        shape: BoxShape.circle,
      ),
      child: const Icon(
        Icons.notifications_outlined,
        size: 20,
        color: AppColors.textPrimary,
      ),
    );
  }
}

class _ActiveProtectionCard extends StatelessWidget {
  const _ActiveProtectionCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          // Truck icon box
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.primaryDark,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.local_shipping_rounded,
              size: 34,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Active protection this week',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  const Text(
                    '₹29',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Text(
                    '/week',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  _Tag('Active', isActive: true),
                  const SizedBox(width: 6),
                  _Tag('Zomato'),
                  const SizedBox(width: 6),
                  _Tag('Chennai'),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String label;
  final bool isActive;

  const _Tag(this.label, {this.isActive = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: isActive
            ? AppColors.textPrimary
            : Colors.white.withValues(alpha: 0.80),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: isActive ? AppColors.primary : AppColors.textPrimary,
        ),
      ),
    );
  }
}

// Wave divider between yellow hero and white content
class _WaveDivider extends StatelessWidget {
  const _WaveDivider();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      width: double.infinity,
      child: CustomPaint(painter: _WavePainter()),
    );
  }
}

class _WavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = AppColors.background;
    final path = Path();
    path.moveTo(0, size.height);
    path.lineTo(0, size.height * 0.5);
    path.quadraticBezierTo(
      size.width * 0.25,
      size.height * -0.2,
      size.width * 0.5,
      size.height * 0.3,
    );
    path.quadraticBezierTo(
      size.width * 0.75,
      size.height * 0.9,
      size.width,
      size.height * 0.2,
    );
    path.lineTo(size.width, size.height);
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ── How It Works ───────────────────────────────────────────────
class _HowItWorksSection extends StatelessWidget {
  const _HowItWorksSection();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'HOW IT WORKS',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.textMuted,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 14),
          _StepCard(
            stepNum: '1',
            title: 'Register your profile',
            desc: 'City, platform, zone & shift — under a minute.',
          ).animate().fadeIn(delay: 200.ms, duration: 300.ms),
          const SizedBox(height: 10),
          _StepCard(
            stepNum: '2',
            title: 'Get weekly protection',
            desc: 'AI prices a fair premium based on your zone risk.',
          ).animate().fadeIn(delay: 260.ms, duration: 300.ms),
          const SizedBox(height: 10),
          _StepCard(
            stepNum: '3',
            title: 'Auto-payout on disruption',
            desc: 'Weather or outage triggers a claim — payout to UPI.',
          ).animate().fadeIn(delay: 320.ms, duration: 300.ms),
        ],
      ),
    );
  }
}

class _StepCard extends StatelessWidget {
  final String stepNum;
  final String title;
  final String desc;

  const _StepCard({
    required this.stepNum,
    required this.title,
    required this.desc,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: AppColors.primaryDark,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                stepNum,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  desc,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.4,
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

// ── Trust stats ────────────────────────────────────────────────
class _TrustStatsRow extends StatelessWidget {
  const _TrustStatsRow();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          _TrustStat('₹29', 'from/week'),
          const SizedBox(width: 8),
          _TrustStat('Auto', 'triggers'),
          const SizedBox(width: 8),
          _TrustStat('UPI', 'payouts'),
          const SizedBox(width: 8),
          _TrustStat('GPS', 'verified'),
        ],
      ).animate().fadeIn(delay: 380.ms, duration: 300.ms),
    );
  }
}

class _TrustStat extends StatelessWidget {
  final String value;
  final String label;

  const _TrustStat(this.value, this.label);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Bottom CTA ─────────────────────────────────────────────────
class _BottomCta extends StatelessWidget {
  final VoidCallback onTap;

  const _BottomCta({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.background.withValues(alpha: 0.0),
            AppColors.background,
          ],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            GestureDetector(
              onTap: onTap,
              child: Container(
                width: 56,
                height: 56,
                decoration: const BoxDecoration(
                  color: AppColors.textPrimary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.arrow_forward_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ).animate().fadeIn(delay: 420.ms, duration: 350.ms),
            const SizedBox(height: 10),
            Text(
              AppStrings.tagline,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
