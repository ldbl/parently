import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'package:parently/core/services/local_storage_service.dart';

class ApiService {
  static const String baseUrl = 'https://your-worker.your-subdomain.workers.dev';
  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // Add logging interceptor for debugging
    _dio.interceptors.add(PrettyDioLogger(
      requestHeader: true,
      requestBody: true,
      responseBody: true,
      responseHeader: false,
      error: true,
      compact: true,
    ));

    // Add auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await LocalStorageService.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired, try to refresh
          final refreshToken = await LocalStorageService.getRefreshToken();
          if (refreshToken != null) {
            try {
              final response = await _dio.post('/api/v1/auth/refresh', data: {
                'refreshToken': refreshToken,
              });
              
              if (response.statusCode == 200) {
                final newToken = response.data['data']['accessToken'];
                await LocalStorageService.saveAccessToken(newToken);
                
                // Retry the original request
                error.requestOptions.headers['Authorization'] = 'Bearer $newToken';
                final retryResponse = await _dio.fetch(error.requestOptions);
                handler.resolve(retryResponse);
                return;
              }
            } catch (e) {
              // Refresh failed, redirect to login
              await LocalStorageService.clearTokens();
            }
          }
        }
        handler.next(error);
      },
    ));
  }

  // Auth endpoints
  Future<Map<String, dynamic>> register({
    required String email,
    required String name,
    required String userType,
    String? parentId,
  }) async {
    final response = await _dio.post('/api/v1/auth/register', data: {
      'email': email,
      'name': name,
      'userType': userType,
      if (parentId != null) 'parentId': parentId,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> login({required String email}) async {
    final response = await _dio.post('/api/v1/auth/login', data: {
      'email': email,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> refreshToken({required String refreshToken}) async {
    final response = await _dio.post('/api/v1/auth/refresh', data: {
      'refreshToken': refreshToken,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await _dio.get('/api/v1/auth/me');
    return response.data;
  }

  Future<void> logout() async {
    await _dio.post('/api/v1/auth/logout');
  }

  // Parent endpoints
  Future<Map<String, dynamic>> createCheckin({
    required String checkinType,
    required int emotionalState,
    required int financialStress,
    String? notes,
    double? unexpectedExpenses,
  }) async {
    final response = await _dio.post('/api/v1/parent/checkin', data: {
      'checkinType': checkinType,
      'emotionalState': emotionalState,
      'financialStress': financialStress,
      if (notes != null) 'notes': notes,
      if (unexpectedExpenses != null) 'unexpectedExpenses': unexpectedExpenses,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getDailyPlan({String? date}) async {
    final queryParams = date != null ? {'date': date} : null;
    final response = await _dio.get('/api/v1/parent/plan', queryParameters: queryParams);
    return response.data;
  }

  Future<Map<String, dynamic>> sendChatMessage({required String message}) async {
    final response = await _dio.post('/api/v1/parent/chat', data: {
      'message': message,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getProgress({int? limit}) async {
    final queryParams = limit != null ? {'limit': limit} : null;
    final response = await _dio.get('/api/v1/parent/progress', queryParameters: queryParams);
    return response.data;
  }

  Future<Map<String, dynamic>> getChildInsights() async {
    final response = await _dio.get('/api/v1/parent/insights');
    return response.data;
  }

  Future<Map<String, dynamic>> createFinancialGoal({
    required String title,
    String? description,
    required double targetAmount,
    required String goalType,
    String? targetDate,
  }) async {
    final response = await _dio.post('/api/v1/parent/goals', data: {
      'title': title,
      if (description != null) 'description': description,
      'targetAmount': targetAmount,
      'goalType': goalType,
      if (targetDate != null) 'targetDate': targetDate,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getFinancialGoals() async {
    final response = await _dio.get('/api/v1/parent/goals');
    return response.data;
  }

  // Children endpoints
  Future<Map<String, dynamic>> sendChildMessage({required String message}) async {
    final response = await _dio.post('/api/v1/kids/message', data: {
      'message': message,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getChildTasks({bool? completed}) async {
    final queryParams = completed != null ? {'completed': completed} : null;
    final response = await _dio.get('/api/v1/kids/tasks', queryParameters: queryParams);
    return response.data;
  }

  Future<Map<String, dynamic>> completeTask({required String taskId}) async {
    final response = await _dio.post('/api/v1/kids/tasks/complete', data: {
      'taskId': taskId,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> createChildTask({
    required String title,
    String? description,
    required String taskType,
    int? points,
    required String childId,
  }) async {
    final response = await _dio.post('/api/v1/kids/tasks?childId=$childId', data: {
      'title': title,
      if (description != null) 'description': description,
      'taskType': taskType,
      if (points != null) 'points': points,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getChildMessages({
    required String childId,
    int? limit,
  }) async {
    final queryParams = <String, dynamic>{
      'childId': childId,
      if (limit != null) 'limit': limit,
    };
    final response = await _dio.get('/api/v1/kids/messages', queryParameters: queryParams);
    return response.data;
  }

  Future<Map<String, dynamic>> getChildSummary({required String childId}) async {
    final response = await _dio.get('/api/v1/kids/summary?childId=$childId');
    return response.data;
  }

  // Health check
  Future<Map<String, dynamic>> healthCheck() async {
    final response = await _dio.get('/health');
    return response.data;
  }
} 