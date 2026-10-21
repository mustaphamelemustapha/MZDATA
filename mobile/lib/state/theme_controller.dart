import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeController extends ChangeNotifier {
  static const _themeModeKey = 'axis_theme_mode_v5'; // fresh key strictly defaulting to system

  ThemeMode _mode = ThemeMode.system;
  bool _loaded = false;

  ThemeController() {
    _load();
  }

  ThemeMode get mode => _mode;
  bool get isSystem => _mode == ThemeMode.system;
  bool get isLight => _mode == ThemeMode.light;
  bool get isDark => _mode == ThemeMode.dark;

  String get modeTitle {
    switch (_mode) {
      case ThemeMode.light:
        return 'Light';
      case ThemeMode.dark:
        return 'Dark';
      case ThemeMode.system:
        return 'System Default';
    }
  }

  String get modeDescription {
    switch (_mode) {
      case ThemeMode.light:
        return 'Always use light theme';
      case ThemeMode.dark:
        return 'Always use dark theme';
      case ThemeMode.system:
        return 'Syncs with your device theme';
    }
  }

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_themeModeKey);
      if (raw == 'light') {
        _mode = ThemeMode.light;
      } else if (raw == 'dark') {
        _mode = ThemeMode.dark;
      } else {
        _mode = ThemeMode.system;
      }
    } catch (_) {
      _mode = ThemeMode.system;
    }
    _loaded = true;
    notifyListeners();
  }

  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_themeModeKey, _mode.name);
    } catch (_) {}
  }

  void setThemeMode(ThemeMode newMode) {
    if (_mode == newMode) return;
    _mode = newMode;
    notifyListeners();
    if (_loaded) {
      unawaited(_persist());
    }
  }

  void resetToSystem() {
    setThemeMode(ThemeMode.system);
  }

  void toggle({Brightness? currentBrightness}) {
    if (_mode == ThemeMode.system) {
      if (currentBrightness == Brightness.dark) {
        _mode = ThemeMode.light;
      } else {
        _mode = ThemeMode.dark;
      }
    } else if (_mode == ThemeMode.light) {
      _mode = ThemeMode.dark;
    } else {
      _mode = ThemeMode.system;
    }
    
    notifyListeners();
    if (_loaded) {
      unawaited(_persist());
    }
  }
}
