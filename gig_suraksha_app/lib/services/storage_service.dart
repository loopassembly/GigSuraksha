import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const _workerKey = 'stored_worker';
  static const _onboardedKey = 'is_onboarded';

  late SharedPreferences _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // ─── Worker Session ──────────────────────────────
  bool get isOnboarded => _prefs.getBool(_onboardedKey) ?? false;

  Future<void> setOnboarded(bool value) async {
    await _prefs.setBool(_onboardedKey, value);
  }

  Future<void> saveWorker(Map<String, dynamic> workerData) async {
    await _prefs.setString(_workerKey, jsonEncode(workerData));
    await setOnboarded(true);
  }

  Map<String, dynamic>? getStoredWorker() {
    final raw = _prefs.getString(_workerKey);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  String? get workerId {
    final worker = getStoredWorker();
    return worker?['worker_id'] as String?;
  }

  Future<void> clearSession() async {
    await _prefs.remove(_workerKey);
    await _prefs.remove(_onboardedKey);
  }
}
