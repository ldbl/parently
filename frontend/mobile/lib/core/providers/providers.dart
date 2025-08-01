import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:parently/core/services/api_service.dart';
import 'package:parently/core/services/local_storage_service.dart';
import 'package:parently/core/models/user.dart';
import 'package:parently/core/models/checkin.dart';
import 'package:parently/core/models/daily_plan.dart';
import 'package:parently/core/models/chat_message.dart';
import 'package:parently/core/models/child_task.dart';

part 'providers.g.dart';

// API Service Provider
@riverpod
ApiService apiService(ApiServiceRef ref) {
  return ApiService();
}

// Auth State Provider
@riverpod
class AuthState extends _$AuthState {
  @override
  Future<User?> build() async {
    // Check if user is logged in
    final token = await LocalStorageService.getAccessToken();
    if (token == null) return null;

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.getCurrentUser();
      
      if (response['success']) {
        final userData = response['data'];
        return User.fromJson(userData);
      }
    } catch (e) {
      // Token might be invalid, clear it
      await LocalStorageService.clearTokens();
    }
    
    return null;
  }

  Future<void> login(String email) async {
    state = const AsyncValue.loading();
    
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.login(email: email);
      
      if (response['success']) {
        final userData = response['data']['user'];
        final tokens = response['data']['tokens'];
        
        // Save tokens
        await LocalStorageService.saveAccessToken(tokens['accessToken']);
        await LocalStorageService.saveRefreshToken(tokens['refreshToken']);
        
        // Update state
        state = AsyncValue.data(User.fromJson(userData));
      } else {
        state = AsyncValue.error(response['error'], StackTrace.current);
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> register({
    required String email,
    required String name,
    required String userType,
    String? parentId,
  }) async {
    state = const AsyncValue.loading();
    
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.register(
        email: email,
        name: name,
        userType: userType,
        parentId: parentId,
      );
      
      if (response['success']) {
        final userData = response['data']['user'];
        final tokens = response['data']['tokens'];
        
        // Save tokens
        await LocalStorageService.saveAccessToken(tokens['accessToken']);
        await LocalStorageService.saveRefreshToken(tokens['refreshToken']);
        
        // Update state
        state = AsyncValue.data(User.fromJson(userData));
      } else {
        state = AsyncValue.error(response['error'], StackTrace.current);
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> logout() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.logout();
    } catch (e) {
      // Ignore logout errors
    }
    
    // Clear local data
    await LocalStorageService.clearTokens();
    await LocalStorageService.clearUser();
    
    // Update state
    state = const AsyncValue.data(null);
  }
}

// Check-ins Provider
@riverpod
class CheckinsNotifier extends _$CheckinsNotifier {
  @override
  Future<List<Checkin>> build() async {
    final user = ref.watch(authStateProvider).value;
    if (user == null) return [];

    final apiService = ref.read(apiServiceProvider);
    final response = await apiService.getProgress(limit: 10);
    
    if (response['success']) {
      final checkinsData = response['data']['checkins'] as List;
      return checkinsData.map((json) => Checkin.fromJson(json)).toList();
    }
    
    return [];
  }

  Future<void> createCheckin({
    required String checkinType,
    required int emotionalState,
    required int financialStress,
    String? notes,
    double? unexpectedExpenses,
  }) async {
    final user = ref.read(authStateProvider).value;
    if (user == null) return;

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.createCheckin(
        checkinType: checkinType,
        emotionalState: emotionalState,
        financialStress: financialStress,
        notes: notes,
        unexpectedExpenses: unexpectedExpenses,
      );

      if (response['success']) {
        // Refresh the list
        ref.invalidateSelf();
      }
    } catch (e) {
      // Handle error
      rethrow;
    }
  }
}

// Daily Plan Provider
@riverpod
class DailyPlanNotifier extends _$DailyPlanNotifier {
  @override
  Future<DailyPlan?> build() async {
    final user = ref.watch(authStateProvider).value;
    if (user == null) return null;

    final today = DateTime.now().toIso8601String().split('T')[0];
    
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.getDailyPlan(date: today);
      
      if (response['success']) {
        final planData = response['data'];
        return DailyPlan.fromJson(planData);
      }
    } catch (e) {
      // Handle error
    }
    
    return null;
  }

  Future<void> refreshPlan() async {
    ref.invalidateSelf();
  }
}

// Chat Messages Provider
@riverpod
class ChatMessagesNotifier extends _$ChatMessagesNotifier {
  @override
  Future<List<ChatMessage>> build() async {
    final user = ref.watch(authStateProvider).value;
    if (user == null) return [];

    final apiService = ref.read(apiServiceProvider);
    final response = await apiService.getProgress(limit: 20);
    
    if (response['success']) {
      final messagesData = response['data']['chatHistory'] as List;
      return messagesData.map((json) => ChatMessage.fromJson(json)).toList();
    }
    
    return [];
  }

  Future<void> sendMessage(String message) async {
    final user = ref.read(authStateProvider).value;
    if (user == null) return;

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.sendChatMessage(message: message);

      if (response['success']) {
        // Refresh the list
        ref.invalidateSelf();
      }
    } catch (e) {
      // Handle error
      rethrow;
    }
  }
}

// Child Tasks Provider
@riverpod
class ChildTasksNotifier extends _$ChildTasksNotifier {
  @override
  Future<List<ChildTask>> build() async {
    final user = ref.watch(authStateProvider).value;
    if (user == null || !user.isChild) return [];

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.getChildTasks();
      
      if (response['success']) {
        final tasksData = response['data']['tasks'] as List;
        return tasksData.map((json) => ChildTask.fromJson(json)).toList();
      }
    } catch (e) {
      // Handle error
    }
    
    return [];
  }

  Future<void> completeTask(String taskId) async {
    final user = ref.read(authStateProvider).value;
    if (user == null || !user.isChild) return;

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.completeTask(taskId: taskId);

      if (response['success']) {
        // Refresh the list
        ref.invalidateSelf();
      }
    } catch (e) {
      // Handle error
      rethrow;
    }
  }

  Future<void> createTask({
    required String title,
    String? description,
    required String taskType,
    int? points,
    required String childId,
  }) async {
    final user = ref.read(authStateProvider).value;
    if (user == null || !user.isParent) return;

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.createChildTask(
        title: title,
        description: description,
        taskType: taskType,
        points: points,
        childId: childId,
      );

      if (response['success']) {
        // Refresh the list
        ref.invalidateSelf();
      }
    } catch (e) {
      // Handle error
      rethrow;
    }
  }
}

// Child Messages Provider
@riverpod
class ChildMessagesNotifier extends _$ChildMessagesNotifier {
  @override
  Future<List<ChatMessage>> build() async {
    final user = ref.watch(authStateProvider).value;
    if (user == null || !user.isChild) return [];

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.getChildMessages(childId: user.id);
      
      if (response['success']) {
        final messagesData = response['data'] as List;
        return messagesData.map((json) => ChatMessage.fromJson(json)).toList();
      }
    } catch (e) {
      // Handle error
    }
    
    return [];
  }

  Future<void> sendMessage(String message) async {
    final user = ref.read(authStateProvider).value;
    if (user == null || !user.isChild) return;

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.sendChildMessage(message: message);

      if (response['success']) {
        // Refresh the list
        ref.invalidateSelf();
      }
    } catch (e) {
      // Handle error
      rethrow;
    }
  }
}

// Settings Provider
@riverpod
class SettingsNotifier extends _$SettingsNotifier {
  @override
  Future<Map<String, dynamic>> build() async {
    final reminderTime = await LocalStorageService.getCheckinReminderTime();
    final themeMode = await LocalStorageService.getThemeMode();
    
    return {
      'reminderTime': reminderTime,
      'themeMode': themeMode ?? 'system',
    };
  }

  Future<void> updateReminderTime(TimeOfDay time) async {
    await LocalStorageService.saveCheckinReminderTime(time);
    ref.invalidateSelf();
  }

  Future<void> updateThemeMode(String mode) async {
    await LocalStorageService.saveThemeMode(mode);
    ref.invalidateSelf();
  }
} 