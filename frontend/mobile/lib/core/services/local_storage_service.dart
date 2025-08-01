import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  static SharedPreferences? _prefs;
  
  // Keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userKey = 'user';
  static const String _checkinReminderTimeKey = 'checkin_reminder_time';
  static const String _isFirstLaunchKey = 'is_first_launch';
  static const String _themeModeKey = 'theme_mode';

  static Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Token management
  static Future<void> saveAccessToken(String token) async {
    await _prefs?.setString(_accessTokenKey, token);
  }

  static Future<String?> getAccessToken() async {
    return _prefs?.getString(_accessTokenKey);
  }

  static Future<void> saveRefreshToken(String token) async {
    await _prefs?.setString(_refreshTokenKey, token);
  }

  static Future<String?> getRefreshToken() async {
    return _prefs?.getString(_refreshTokenKey);
  }

  static Future<void> clearTokens() async {
    await _prefs?.remove(_accessTokenKey);
    await _prefs?.remove(_refreshTokenKey);
  }

  // User data
  static Future<void> saveUser(Map<String, dynamic> user) async {
    await _prefs?.setString(_userKey, user.toString());
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final userString = _prefs?.getString(_userKey);
    if (userString != null) {
      // Simple parsing - in production, use proper JSON serialization
      try {
        return Map<String, dynamic>.from(
          userString as Map<String, dynamic>,
        );
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  static Future<void> clearUser() async {
    await _prefs?.remove(_userKey);
  }

  // Check-in reminder settings
  static Future<void> saveCheckinReminderTime(TimeOfDay time) async {
    final timeString = '${time.hour}:${time.minute}';
    await _prefs?.setString(_checkinReminderTimeKey, timeString);
  }

  static Future<TimeOfDay?> getCheckinReminderTime() async {
    final timeString = _prefs?.getString(_checkinReminderTimeKey);
    if (timeString != null) {
      final parts = timeString.split(':');
      if (parts.length == 2) {
        final hour = int.tryParse(parts[0]);
        final minute = int.tryParse(parts[1]);
        if (hour != null && minute != null) {
          return TimeOfDay(hour: hour, minute: minute);
        }
      }
    }
    return null;
  }

  // First launch flag
  static Future<bool> isFirstLaunch() async {
    return _prefs?.getBool(_isFirstLaunchKey) ?? true;
  }

  static Future<void> setFirstLaunchComplete() async {
    await _prefs?.setBool(_isFirstLaunchKey, false);
  }

  // Theme mode
  static Future<void> saveThemeMode(String mode) async {
    await _prefs?.setString(_themeModeKey, mode);
  }

  static Future<String?> getThemeMode() async {
    return _prefs?.getString(_themeModeKey);
  }

  // Clear all data
  static Future<void> clearAll() async {
    await _prefs?.clear();
  }
}

class TimeOfDay {
  final int hour;
  final int minute;

  const TimeOfDay({required this.hour, required this.minute});

  @override
  String toString() => 'TimeOfDay(hour: $hour, minute: $minute)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TimeOfDay && other.hour == hour && other.minute == minute;
  }

  @override
  int get hashCode => hour.hashCode ^ minute.hashCode;
} 