import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Warm golden-yellow palette for a gig-worker insurance app.
//  Inspired by modern logistics/delivery UI patterns.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class AppColors {
  // ─── BRAND / PRIMARY ────────────────────────────────────────
  static const primary = Color(0xFFFFCA28);      // Golden yellow
  static const primaryDark = Color(0xFFF5A623);   // Deeper amber
  static const primaryDeep = Color(0xFFE69500);    // Rich amber
  static const primaryLight = Color(0xFFFFE082);   // Soft yellow
  static const primaryFaint = Color(0xFFFFF8E1);   // Whisper yellow bg
  static const primarySoft = Color(0xFFFFD54F);    // Mid-yellow
  static const primarySurface = Color(0xFFFFF3C4); // Tinted yellow surface

  // ─── HERO CARD (dark surface for greeting) ──────────────────
  static const heroCardStart = Color(0xFF1B1D21);  // Near-black charcoal
  static const heroCardEnd = Color(0xFF2A2D35);    // Dark slate
  static const textOnDark = Color(0xFFF8F8F8);     // Clean white for dark bg

  // ─── ACCENT (alerts / urgency) ──────────────────────────────
  static const accent = Color(0xFFE53935);         // Red for urgency
  static const accentSoft = Color(0xFFEF9A9A);
  static const accentFaint = Color(0xFFFFF1F0);
  static const accentDark = Color(0xFFC62828);

  // ─── BACKGROUNDS & SURFACES ─────────────────────────────────
  static const background = Color(0xFFF5F5F5);    // Clean light grey
  static const backgroundDeep = Color(0xFFEEEEEE); // Medium grey
  static const surface = Color(0xFFFFFFFF);
  static const surfaceElevated = Color(0xFFF8F8F8);
  static const surfaceCard = Color(0xFFFFFFFF);
  static const surfaceCardLight = Color(0xFFFCFCFC);

  // ─── TEXT ───────────────────────────────────────────────────
  static const textPrimary = Color(0xFF1A1A1A);
  static const textSecondary = Color(0xFF5A5A5A);
  static const textMuted = Color(0xFF9E9E9E);
  static const textOnPrimary = Color(0xFF1A1A1A);  // Dark text on yellow

  // ─── BORDERS ────────────────────────────────────────────────
  static const border = Color(0xFFE8E5DE);
  static const borderLight = Color(0xFFF0EDE6);
  static const borderFocus = Color(0xFFFFCA28);

  // ─── SEMANTIC ───────────────────────────────────────────────
  static const success = Color(0xFF2E7D32);
  static const successDark = Color(0xFF1B5E20);
  static const successSurface = Color(0xFFE8F5E9);
  static const warning = Color(0xFFEF6C00);
  static const warningDark = Color(0xFFE65100);
  static const warningSurface = Color(0xFFFFF3E0);
  static const error = Color(0xFFD32F2F);
  static const errorDark = Color(0xFFB71C1C);
  static const errorSurface = Color(0xFFFFEBEE);
  static const info = Color(0xFF1976D2);

  // ─── RISK BANDS ─────────────────────────────────────────────
  static const riskLow = Color(0xFF2E7D32);
  static const riskMedium = Color(0xFFEF6C00);
  static const riskHigh = Color(0xFFD32F2F);

  // ─── EVENT TYPE COLORS ──────────────────────────────────────
  static const rainColor = Color(0xFF1976D2);
  static const floodColor = Color(0xFF0097A7);
  static const heatColor = Color(0xFFD32F2F);
  static const aqiColor = Color(0xFF558B2F);
  static const outageColor = Color(0xFFE53935);
  static const storeColor = Color(0xFFEF6C00);
  static const accessColor = Color(0xFFF9A825);

  // ─── GRADIENTS ──────────────────────────────────────────────
  static const primaryGradient = LinearGradient(
    colors: [Color(0xFFF5A623), Color(0xFFFFCA28)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Dark hero gradient for the dashboard greeting card.
  static const heroGradient = LinearGradient(
    colors: [heroCardStart, heroCardEnd],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Legacy compat aliases
  static const cardGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFFCFBF8)],
  );
  static const cardGradientSoft = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFFCFBF8)],
  );
  static const signalGradient = LinearGradient(
    colors: [Color(0xFFFFF8E1), Color(0xFFFFF3C4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  static const ctaGradient = LinearGradient(
    colors: [Color(0xFFF5A623), Color(0xFFFFCA28)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
  static const navGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFFCFBF8)],
  );
  static const shimmerGradient = LinearGradient(
    colors: [Color(0xFFF0EDE6), Color(0xFFE8E5DE), Color(0xFFF0EDE6)],
    stops: [0.1, 0.45, 0.9],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  static const sunriseGradient = LinearGradient(
    colors: [Color(0xFFE69500), Color(0xFFFFCA28)],
  );
  static const heroOverlayGradient = LinearGradient(
    colors: [Colors.transparent, Colors.transparent],
  );
}

class AppTheme {
  static ThemeData get darkTheme {
    final baseText = GoogleFonts.interTextTheme(
      ThemeData.light(useMaterial3: true).textTheme,
    );

    final textTheme = baseText.copyWith(
      headlineLarge: baseText.headlineLarge?.copyWith(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
        height: 1.2,
        letterSpacing: -0.5,
      ),
      headlineMedium: baseText.headlineMedium?.copyWith(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
        height: 1.2,
        letterSpacing: -0.3,
      ),
      headlineSmall: baseText.headlineSmall?.copyWith(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
        height: 1.25,
      ),
      titleLarge: baseText.titleLarge?.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
        height: 1.3,
      ),
      titleMedium: baseText.titleMedium?.copyWith(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
        height: 1.3,
      ),
      titleSmall: baseText.titleSmall?.copyWith(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: AppColors.textSecondary,
        height: 1.3,
      ),
      bodyLarge: baseText.bodyLarge?.copyWith(
        fontSize: 15,
        color: AppColors.textPrimary,
        height: 1.5,
      ),
      bodyMedium: baseText.bodyMedium?.copyWith(
        fontSize: 14,
        color: AppColors.textSecondary,
        height: 1.5,
      ),
      bodySmall: baseText.bodySmall?.copyWith(
        fontSize: 12,
        color: AppColors.textMuted,
        height: 1.5,
      ),
      labelLarge: baseText.labelLarge?.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
      labelMedium: baseText.labelMedium?.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppColors.textSecondary,
      ),
      labelSmall: baseText.labelSmall?.copyWith(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        color: AppColors.textMuted,
        letterSpacing: 0.8,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.background,
      primaryColor: AppColors.primary,
      splashColor: AppColors.primary.withValues(alpha: 0.12),
      highlightColor: AppColors.primary.withValues(alpha: 0.06),
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.accent,
        surface: AppColors.surface,
        error: AppColors.error,
        onPrimary: AppColors.textOnPrimary,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimary,
        onError: Colors.white,
      ),
      textTheme: textTheme,
      iconTheme: const IconThemeData(color: AppColors.textSecondary, size: 20),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0.5,
        shadowColor: AppColors.border,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 2,
        shadowColor: Colors.black12,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide.none,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textOnPrimary,
          elevation: 0,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          side: const BorderSide(color: AppColors.border),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: GoogleFonts.inter(color: AppColors.textMuted, fontSize: 14),
        labelStyle: GoogleFonts.inter(
          color: AppColors.textSecondary,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.primaryDark,
        unselectedItemColor: AppColors.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 1,
        space: 20,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surface,
        selectedColor: AppColors.primaryFaint,
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primaryDark,
        linearTrackColor: AppColors.borderLight,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.textPrimary,
        contentTextStyle: GoogleFonts.inter(
          color: AppColors.surface,
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        titleTextStyle: GoogleFonts.inter(
          color: AppColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        contentTextStyle: GoogleFonts.inter(
          color: AppColors.textSecondary,
          fontSize: 14,
          height: 1.5,
        ),
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }
}
