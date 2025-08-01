import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;
import 'package:parently/core/services/local_storage_service.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  static Future<void> initialize() async {
    // Initialize timezone
    tz.initializeTimeZones();

    // Request permission for notifications
    await _requestPermissions();

    // Initialize local notifications
    await _initializeLocalNotifications();

    // Handle Firebase messages
    _handleFirebaseMessages();

    // Handle notification taps
    _handleNotificationTaps();
  }

  static Future<void> _requestPermissions() async {
    // Request permission for local notifications
    const androidSettings = AndroidFlutterLocalNotificationsPlugin();
    await androidSettings.requestPermission();

    // Request permission for Firebase messaging
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission for notifications');
    }
  }

  static Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initializationSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );
  }

  static void _handleFirebaseMessages() {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showLocalNotification(
        title: message.notification?.title ?? 'Parently',
        body: message.notification?.body ?? '',
        payload: message.data.toString(),
      );
    });

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }

  static void _handleNotificationTaps() {
    // Handle notification taps when app is opened from notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleNotificationData(message.data);
    });
  }

  static void _onNotificationTapped(NotificationResponse response) {
    // Handle local notification taps
    if (response.payload != null) {
      // Parse payload and navigate accordingly
      print('Notification tapped with payload: ${response.payload}');
    }
  }

  static Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'parently_channel',
      'Parently Notifications',
      channelDescription: 'Notifications from Parently app',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      notificationDetails,
      payload: payload,
    );
  }

  static void _handleNotificationData(Map<String, dynamic> data) {
    // Handle different types of notifications
    final type = data['type'];
    
    switch (type) {
      case 'checkin_reminder':
        // Navigate to check-in screen
        print('Navigate to check-in screen');
        break;
      case 'daily_plan':
        // Navigate to daily plan screen
        print('Navigate to daily plan screen');
        break;
      case 'child_message':
        // Navigate to child insights
        print('Navigate to child insights');
        break;
      default:
        print('Unknown notification type: $type');
    }
  }

  // Schedule check-in reminders
  static Future<void> scheduleCheckinReminders() async {
    final reminderTime = await LocalStorageService.getCheckinReminderTime();
    if (reminderTime == null) return;

    // Schedule morning check-in reminder
    await _scheduleNotification(
      id: 1,
      title: 'Morning Check-in',
      body: 'How are you feeling this morning? Take a moment to check in.',
      scheduledDate: _getNextScheduledTime(reminderTime.hour, reminderTime.minute),
      payload: 'checkin_morning',
    );

    // Schedule evening check-in reminder (8 hours later)
    await _scheduleNotification(
      id: 2,
      title: 'Evening Check-in',
      body: 'How was your day? Let\'s reflect on your emotional and financial well-being.',
      scheduledDate: _getNextScheduledTime(reminderTime.hour + 8, reminderTime.minute),
      payload: 'checkin_evening',
    );
  }

  static Future<void> _scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'parently_reminders',
      'Parently Reminders',
      channelDescription: 'Scheduled reminders from Parently',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.zonedSchedule(
      id,
      title,
      body,
      tz.TZDateTime.from(scheduledDate, tz.local),
      notificationDetails,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      payload: payload,
    );
  }

  static DateTime _getNextScheduledTime(int hour, int minute) {
    final now = DateTime.now();
    var scheduledDate = DateTime(now.year, now.month, now.day, hour, minute);
    
    // If the time has already passed today, schedule for tomorrow
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }
    
    return scheduledDate;
  }

  // Get FCM token
  static Future<String?> getFCMToken() async {
    return await _firebaseMessaging.getToken();
  }

  // Subscribe to topics
  static Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
  }

  // Unsubscribe from topics
  static Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
  }

  // Cancel all scheduled notifications
  static Future<void> cancelAllScheduledNotifications() async {
    await _localNotifications.cancelAll();
  }

  // Cancel specific notification
  static Future<void> cancelNotification(int id) async {
    await _localNotifications.cancel(id);
  }
}

// Background message handler
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('Handling background message: ${message.messageId}');
  
  // Show local notification for background messages
  await NotificationService._showLocalNotification(
    title: message.notification?.title ?? 'Parently',
    body: message.notification?.body ?? '',
    payload: message.data.toString(),
  );
} 