import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/constants.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  final String? detail;

  ApiException(this.statusCode, this.message, {this.detail});

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiService {
  final http.Client _client;
  final String _baseUrl;

  ApiService({http.Client? client, String? baseUrl})
    : _client = client ?? http.Client(),
      _baseUrl = baseUrl ?? ApiConstants.baseUrl;

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? queryParams,
  }) async {
    final uri = Uri.parse(
      '$_baseUrl$path',
    ).replace(queryParameters: queryParams);

    late http.Response response;

    final headers = {'Content-Type': 'application/json'};

    switch (method) {
      case 'GET':
        response = await _client.get(uri, headers: headers);
        break;
      case 'POST':
        response = await _client.post(
          uri,
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      default:
        throw ApiException(0, 'Unsupported HTTP method: $method');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }

    String errorMsg = 'Request failed (${response.statusCode})';
    String? detailStr;
    try {
      final errBody = jsonDecode(response.body);
      if (errBody is Map) {
        detailStr =
            errBody['detail']?.toString() ?? errBody['message']?.toString();
        if (detailStr != null) errorMsg = detailStr;
      }
    } catch (_) {}

    throw ApiException(response.statusCode, errorMsg, detail: detailStr);
  }

  // ─── Health ──────────────────────────────────────
  Future<bool> checkHealth() async {
    try {
      final data = await _request('GET', ApiConstants.health);
      return data['status'] == 'ok';
    } catch (_) {
      return false;
    }
  }

  // ─── Workers ─────────────────────────────────────
  Future<Map<String, dynamic>> registerWorker({
    required String name,
    required String phone,
    required String city,
    required String platform,
    required String zone,
    required String shiftType,
    required double weeklyEarnings,
    required double weeklyActiveHours,
    required String upiId,
  }) {
    return _request(
      'POST',
      ApiConstants.workerRegister,
      body: {
        'name': name,
        'phone': phone,
        'city': city,
        'platform': platform,
        'zone': zone,
        'shift_type': shiftType,
        'weekly_earnings': weeklyEarnings,
        'weekly_active_hours': weeklyActiveHours,
        'upi_id': upiId,
      },
    );
  }

  Future<Map<String, dynamic>> getWorker(String workerId) {
    return _request('GET', ApiConstants.workerById(workerId));
  }

  // ─── Quotes ──────────────────────────────────────
  Future<Map<String, dynamic>> generateQuote({
    required String city,
    required String zone,
    required String shiftType,
    required String coverageTier,
    required double weeklyEarnings,
    required double weeklyActiveHours,
  }) {
    return _request(
      'POST',
      ApiConstants.quoteGenerate,
      body: {
        'worker_profile': {
          'city': city,
          'zone': zone,
          'shift_type': shiftType,
          'coverage_tier': coverageTier,
          'weekly_earnings': weeklyEarnings,
          'weekly_active_hours': weeklyActiveHours,
        },
      },
    );
  }

  // ─── Policies ────────────────────────────────────
  Future<Map<String, dynamic>> createPolicyForWorker({
    required String workerId,
    required String coverageTier,
  }) {
    return _request(
      'POST',
      ApiConstants.policyCreate,
      body: {'worker_id': workerId, 'coverage_tier': coverageTier},
    );
  }

  Future<Map<String, dynamic>> createPolicyFromProfile({
    required String city,
    required String zone,
    required String shiftType,
    required String coverageTier,
    required double weeklyEarnings,
    required double weeklyActiveHours,
  }) {
    return _request(
      'POST',
      ApiConstants.policyCreate,
      body: {
        'worker_profile': {
          'city': city,
          'zone': zone,
          'shift_type': shiftType,
          'coverage_tier': coverageTier,
          'weekly_earnings': weeklyEarnings,
          'weekly_active_hours': weeklyActiveHours,
        },
      },
    );
  }

  Future<Map<String, dynamic>> getPolicy(String policyId) {
    return _request('GET', ApiConstants.policyById(policyId));
  }

  Future<List<dynamic>> getWorkerPolicies(String workerId) async {
    final data = await _request(
      'GET',
      ApiConstants.policiesForWorker(workerId),
    );
    return data['policies'] as List<dynamic>;
  }

  // ─── Events ──────────────────────────────────────
  Future<Map<String, dynamic>> simulateEvent({
    required String eventType,
    required String city,
    required String zone,
    required String severity,
    required String startTime,
    required double durationHours,
    String source = 'simulation',
    bool verified = true,
  }) {
    return _request(
      'POST',
      ApiConstants.eventSimulate,
      body: {
        'event_type': eventType,
        'city': city,
        'zone': zone,
        'severity': severity,
        'start_time': startTime,
        'duration_hours': durationHours,
        'source': source,
        'verified': verified,
      },
    );
  }

  // ─── Claims ──────────────────────────────────────
  Future<Map<String, dynamic>> getClaim(String claimId) {
    return _request('GET', ApiConstants.claimById(claimId));
  }

  Future<List<dynamic>> getWorkerClaims(String workerId) async {
    final data = await _request('GET', ApiConstants.claimsForWorker(workerId));
    return data['claims'] as List<dynamic>;
  }

  Future<List<dynamic>> getAllClaims() async {
    final data = await _request('GET', ApiConstants.allClaims);
    return data['claims'] as List<dynamic>;
  }

  // ─── Admin ───────────────────────────────────────
  Future<Map<String, dynamic>> getAdminSummary() {
    return _request('GET', ApiConstants.adminSummary);
  }

  // ─── Trigger Monitor ────────────────────────────
  Future<Map<String, dynamic>> runTriggerMonitor({bool dryRun = false}) {
    return _request(
      'POST',
      ApiConstants.triggerMonitor,
      body: {'dry_run': dryRun},
    );
  }

  void dispose() {
    _client.close();
  }
}
