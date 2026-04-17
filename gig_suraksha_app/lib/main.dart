import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'config/theme.dart';
import 'firebase_options.dart';
import 'services/api_service.dart';
import 'services/payment_service.dart';
import 'services/storage_service.dart';
import 'services/telemetry_service.dart';
import 'services/verification_service.dart';
import 'providers/worker_provider.dart';
import 'providers/policy_provider.dart';
import 'providers/claim_provider.dart';
import 'providers/verification_provider.dart';
import 'screens/welcome_screen.dart';
import 'screens/home_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // System UI appearance
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: AppColors.surface,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Init services
  final storageService = StorageService();
  await storageService.init();
  final apiService = ApiService();
  final telemetryService = await _bootstrapTelemetry();
  final verificationService = VerificationService();
  await verificationService.init();
  final storedWorker = storageService.getStoredWorker();

  if (storedWorker != null) {
    await telemetryService.setWorkerContext(
      workerId: storedWorker['worker_id'] as String?,
      city: storedWorker['city'] as String?,
      zone: storedWorker['zone'] as String?,
      platform: storedWorker['platform'] as String?,
      shiftType: storedWorker['shift_type'] as String?,
    );
  }

  runApp(
    GigSurakshaApp(
      storageService: storageService,
      apiService: apiService,
      telemetryService: telemetryService,
      verificationService: verificationService,
    ),
  );
}

Future<TelemetryService> _bootstrapTelemetry() async {
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    final service = TelemetryService.live(
      analytics: FirebaseAnalytics.instance,
    );
    await service.logAppOpened();
    return service;
  } catch (_) {
    return TelemetryService.disabled();
  }
}

class GigSurakshaApp extends StatelessWidget {
  final StorageService storageService;
  final ApiService apiService;
  final TelemetryService telemetryService;
  final VerificationService verificationService;

  const GigSurakshaApp({
    super.key,
    required this.storageService,
    required this.apiService,
    required this.telemetryService,
    required this.verificationService,
  });

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiService>.value(value: apiService),
        Provider<StorageService>.value(value: storageService),
        Provider<TelemetryService>.value(value: telemetryService),
        Provider<VerificationService>.value(value: verificationService),
        Provider<PaymentService>(
          create: (context) =>
              PaymentService(telemetry: context.read<TelemetryService>()),
          dispose: (_, paymentService) => paymentService.dispose(),
        ),
        ChangeNotifierProvider(
          create: (_) => WorkerProvider(apiService, storageService),
        ),
        ChangeNotifierProvider(create: (_) => PolicyProvider(apiService)),
        ChangeNotifierProvider(create: (_) => ClaimProvider(apiService)),
        ChangeNotifierProvider(
          create: (_) =>
              VerificationProvider(verificationService, telemetryService),
        ),
      ],
      child: MaterialApp(
        title: 'GigSuraksha',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        navigatorObservers: telemetryService.navigatorObservers,
        home: storageService.isOnboarded
            ? const HomeShell()
            : const WelcomeScreen(),
      ),
    );
  }
}
