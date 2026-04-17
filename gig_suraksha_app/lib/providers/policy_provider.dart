import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class PolicyProvider extends ChangeNotifier {
  final ApiService _api;

  List<Map<String, dynamic>> _policies = [];
  Map<String, dynamic>? _latestQuote;
  bool _loading = false;
  String? _errorMessage;

  PolicyProvider(this._api);

  List<Map<String, dynamic>> get policies => _policies;
  Map<String, dynamic>? get latestQuote => _latestQuote;
  bool get loading => _loading;
  String? get error => _errorMessage;

  Map<String, dynamic>? get activePolicy {
    try {
      return _policies.firstWhere((p) => p['status'] == 'active');
    } catch (_) {
      return null;
    }
  }

  Future<void> fetchPolicies(String workerId) async {
    _loading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _api.getWorkerPolicies(workerId);
      _policies = result.cast<Map<String, dynamic>>();
      _loading = false;
      notifyListeners();
    } on ApiException catch (err) {
      _errorMessage = err.message;
      _loading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Unable to fetch policies';
      _loading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> generateQuote({
    required String city,
    required String zone,
    required String shiftType,
    required String coverageTier,
    required double weeklyEarnings,
    required double weeklyActiveHours,
  }) async {
    _loading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _api.generateQuote(
        city: city,
        zone: zone,
        shiftType: shiftType,
        coverageTier: coverageTier,
        weeklyEarnings: weeklyEarnings,
        weeklyActiveHours: weeklyActiveHours,
      );
      _latestQuote = result;
      _loading = false;
      notifyListeners();
      return result;
    } on ApiException catch (err) {
      _errorMessage = err.message;
      _loading = false;
      notifyListeners();
      return null;
    } catch (_) {
      _errorMessage = 'Unable to generate quote. Check your connection.';
      _loading = false;
      notifyListeners();
      return null;
    }
  }

  Future<Map<String, dynamic>?> activatePolicy({
    required String workerId,
    required String coverageTier,
  }) async {
    _loading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final policy = await _api.createPolicyForWorker(
        workerId: workerId,
        coverageTier: coverageTier,
      );
      _policies.insert(0, policy);
      _loading = false;
      notifyListeners();
      return policy;
    } on ApiException catch (err) {
      _errorMessage = err.message;
      _loading = false;
      notifyListeners();
      return null;
    } catch (_) {
      _errorMessage = 'Unable to activate policy';
      _loading = false;
      notifyListeners();
      return null;
    }
  }

  void clearQuote() {
    _latestQuote = null;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
