import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class ClaimProvider extends ChangeNotifier {
  final ApiService _api;

  List<Map<String, dynamic>> _claims = [];
  bool _loading = false;
  String? _errorMessage;

  ClaimProvider(this._api);

  List<Map<String, dynamic>> get claims => _claims;
  bool get loading => _loading;
  String? get error => _errorMessage;

  int get totalClaims => _claims.length;

  double get totalPayouts {
    double sum = 0;
    for (final claim in _claims) {
      sum += (claim['payout_amount'] as num?)?.toDouble() ?? 0;
    }
    return sum;
  }

  int get pendingCount =>
      _claims.where((c) => c['status'] == 'auto_initiated').length;
  int get approvedCount =>
      _claims.where((c) => c['status'] == 'approved').length;

  Future<void> fetchWorkerClaims(String workerId) async {
    _loading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _api.getWorkerClaims(workerId);
      _claims = result.cast<Map<String, dynamic>>();
      _loading = false;
      notifyListeners();
    } on ApiException catch (err) {
      _errorMessage = err.message;
      _loading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Unable to load claims';
      _loading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
