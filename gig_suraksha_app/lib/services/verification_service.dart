import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class VerificationService {
  static const _kycProfileKey = 'kyc_profile';
  static const _claimEvidenceKey = 'claim_evidence_map';

  final ImagePicker _picker = ImagePicker();
  late SharedPreferences _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  Map<String, dynamic>? getKycProfile() {
    final raw = _prefs.getString(_kycProfileKey);
    if (raw == null || raw.isEmpty) {
      return null;
    }

    final decoded = jsonDecode(raw);
    return decoded is Map ? Map<String, dynamic>.from(decoded) : null;
  }

  Map<String, dynamic> getClaimEvidenceMap() {
    final raw = _prefs.getString(_claimEvidenceKey);
    if (raw == null || raw.isEmpty) {
      return {};
    }

    final decoded = jsonDecode(raw);
    return decoded is Map ? Map<String, dynamic>.from(decoded) : {};
  }

  Future<void> saveKycProfile(Map<String, dynamic> profile) async {
    await _prefs.setString(_kycProfileKey, jsonEncode(profile));
  }

  Future<void> saveClaimEvidenceMap(Map<String, dynamic> evidenceMap) async {
    await _prefs.setString(_claimEvidenceKey, jsonEncode(evidenceMap));
  }

  /// Returns true when the app is running inside the iOS Simulator.
  /// The simulator always has the SIMULATOR_DEVICE_NAME env variable set by Xcode.
  bool get _isIosSimulator =>
      !kIsWeb &&
      Platform.isIOS &&
      Platform.environment.containsKey('SIMULATOR_DEVICE_NAME');

  Future<Map<String, dynamic>?> capturePhoto({
    required String category,
    bool useFrontCamera = false,
  }) async {
    // iOS Simulator has no camera hardware — fall back to gallery for dev testing.
    final source = _isIosSimulator ? ImageSource.gallery : ImageSource.camera;
    final picked = await _picker.pickImage(
      source: source,
      preferredCameraDevice: useFrontCamera
          ? CameraDevice.front
          : CameraDevice.rear,
      imageQuality: 82,
      maxWidth: 1800,
    );

    if (picked == null) {
      return null;
    }

    final storedPath = await _storeImage(
      sourcePath: picked.path,
      category: category,
    );
    return {
      'path': storedPath,
      'captured_at': DateTime.now().toIso8601String(),
      'category': category,
    };
  }

  Future<void> clearAll() async {
    final paths = <String>{
      ..._collectPaths(getKycProfile()),
      ..._collectPaths(getClaimEvidenceMap()),
    };

    for (final path in paths) {
      final file = File(path);
      if (await file.exists()) {
        await file.delete();
      }
    }

    await _prefs.remove(_kycProfileKey);
    await _prefs.remove(_claimEvidenceKey);
  }

  Future<String> _storeImage({
    required String sourcePath,
    required String category,
  }) async {
    final docs = await getApplicationDocumentsDirectory();
    final dir = Directory('${docs.path}/trust_evidence');
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }

    final extension = _extensionOf(sourcePath);
    final filename =
        '${category}_${DateTime.now().millisecondsSinceEpoch}$extension';
    final targetPath = '${dir.path}/$filename';
    await File(sourcePath).copy(targetPath);
    return targetPath;
  }

  String _extensionOf(String sourcePath) {
    final dotIndex = sourcePath.lastIndexOf('.');
    if (dotIndex == -1 || dotIndex == sourcePath.length - 1) {
      return '.jpg';
    }
    return sourcePath.substring(dotIndex);
  }

  Set<String> _collectPaths(dynamic value) {
    final paths = <String>{};

    void collect(dynamic node) {
      if (node is Map) {
        for (final entry in node.entries) {
          if (entry.key == 'path' && entry.value is String) {
            paths.add(entry.value as String);
          } else {
            collect(entry.value);
          }
        }
      } else if (node is List) {
        for (final item in node) {
          collect(item);
        }
      }
    }

    collect(value);
    return paths;
  }
}
