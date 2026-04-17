import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class WorkerProvider extends ChangeNotifier {
  final ApiService _api;
  final StorageService _storage;

  Map<String, dynamic>? _worker;
  bool _loading = false;
  String? _errorMessage;

  WorkerProvider(this._api, this._storage) {
    _worker = _storage.getStoredWorker();
  }

  Map<String, dynamic>? get worker => _worker;
  bool get isRegistered => _worker != null;
  bool get loading => _loading;
  String? get error => _errorMessage;
  String? get workerId => _worker?['worker_id'] as String?;
  String get workerName => _worker?['name'] as String? ?? '';
  String get workerPhone => _worker?['phone'] as String? ?? '';
  String get workerCity => _worker?['city'] as String? ?? '';
  String get workerZone => _worker?['zone'] as String? ?? '';
  String get workerShift => _worker?['shift_type'] as String? ?? '';
  String get workerPlatform => _worker?['platform'] as String? ?? '';
  String get workerUpiId => _worker?['upi_id'] as String? ?? '';
  double get weeklyEarnings =>
      (_worker?['weekly_earnings'] as num?)?.toDouble() ?? 0;
  double get weeklyActiveHours =>
      (_worker?['weekly_active_hours'] as num?)?.toDouble() ?? 0;

  Future<bool> registerWorker({
    required String name,
    required String phone,
    required String city,
    required String platform,
    required String zone,
    required String shiftType,
    required double weeklyEarnings,
    required double weeklyActiveHours,
    required String upiId,
  }) async {
    _loading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _api.registerWorker(
        name: name,
        phone: phone,
        city: city,
        platform: platform,
        zone: zone,
        shiftType: shiftType,
        weeklyEarnings: weeklyEarnings,
        weeklyActiveHours: weeklyActiveHours,
        upiId: upiId,
      );

      _worker = result;
      await _storage.saveWorker(result);
      _loading = false;
      notifyListeners();
      return true;
    } on ApiException catch (err) {
      _errorMessage = err.message;
      _loading = false;
      notifyListeners();
      return false;
    } catch (err) {
      _errorMessage = 'Connection failed. Please check your internet.';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> refreshWorker() async {
    final wid = workerId;
    if (wid == null) return;

    try {
      final fresh = await _api.getWorker(wid);
      _worker = fresh;
      await _storage.saveWorker(fresh);
      notifyListeners();
    } catch (_) {
      // keep stale data
    }
  }

  Future<void> logout() async {
    _worker = null;
    await _storage.clearSession();
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
