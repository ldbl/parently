import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:parently/core/providers/providers.dart';
import 'package:parently/features/auth/presentation/screens/login_screen.dart';
import 'package:parently/features/auth/presentation/screens/register_screen.dart';
import 'package:parently/features/onboarding/presentation/screens/onboarding_screen.dart';
import 'package:parently/features/parent/presentation/screens/parent_home_screen.dart';
import 'package:parently/features/parent/presentation/screens/checkin_screen.dart';
import 'package:parently/features/parent/presentation/screens/plan_screen.dart';
import 'package:parently/features/parent/presentation/screens/chat_screen.dart';
import 'package:parently/features/parent/presentation/screens/progress_screen.dart';
import 'package:parently/features/parent/presentation/screens/goals_screen.dart';
import 'package:parently/features/parent/presentation/screens/insights_screen.dart';
import 'package:parently/features/child/presentation/screens/child_home_screen.dart';
import 'package:parently/features/child/presentation/screens/child_chat_screen.dart';
import 'package:parently/features/child/presentation/screens/tasks_screen.dart';
import 'package:parently/features/settings/presentation/screens/settings_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = authState.value != null;
      final isOnboarding = state.matchedLocation == '/onboarding';
      final isAuth = state.matchedLocation.startsWith('/auth');
      
      // Show loading screen while checking auth state
      if (authState.isLoading) {
        return '/loading';
      }
      
      // Check if first launch
      if (!isLoggedIn && !isOnboarding && !isAuth) {
        return '/onboarding';
      }
      
      // If not logged in, redirect to auth
      if (!isLoggedIn && !isOnboarding) {
        return '/auth/login';
      }
      
      // If logged in, redirect to appropriate home screen
      if (isLoggedIn && (isOnboarding || isAuth)) {
        final user = authState.value!;
        return user.isParent ? '/parent' : '/child';
      }
      
      return null;
    },
    routes: [
      // Onboarding
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      
      // Loading screen
      GoRoute(
        path: '/loading',
        builder: (context, state) => const Scaffold(
          body: Center(
            child: CircularProgressIndicator(),
          ),
        ),
      ),
      
      // Auth routes
      GoRoute(
        path: '/auth/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      
      // Parent routes
      GoRoute(
        path: '/parent',
        builder: (context, state) => const ParentHomeScreen(),
        routes: [
          GoRoute(
            path: 'checkin',
            builder: (context, state) => const CheckinScreen(),
          ),
          GoRoute(
            path: 'plan',
            builder: (context, state) => const PlanScreen(),
          ),
          GoRoute(
            path: 'chat',
            builder: (context, state) => const ChatScreen(),
          ),
          GoRoute(
            path: 'progress',
            builder: (context, state) => const ProgressScreen(),
          ),
          GoRoute(
            path: 'goals',
            builder: (context, state) => const GoalsScreen(),
          ),
          GoRoute(
            path: 'insights',
            builder: (context, state) => const InsightsScreen(),
          ),
          GoRoute(
            path: 'settings',
            builder: (context, state) => const SettingsScreen(),
          ),
        ],
      ),
      
      // Child routes
      GoRoute(
        path: '/child',
        builder: (context, state) => const ChildHomeScreen(),
        routes: [
          GoRoute(
            path: 'chat',
            builder: (context, state) => const ChildChatScreen(),
          ),
          GoRoute(
            path: 'tasks',
            builder: (context, state) => const TasksScreen(),
          ),
          GoRoute(
            path: 'settings',
            builder: (context, state) => const SettingsScreen(),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'The page you are looking for does not exist.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
}); 