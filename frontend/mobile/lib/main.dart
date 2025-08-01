import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:parently/core/theme/app_theme.dart';
import 'package:parently/core/routing/app_router.dart';
import 'package:parently/core/services/notification_service.dart';
import 'package:parently/core/services/local_storage_service.dart';
import 'package:parently/firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Initialize services
  await LocalStorageService.initialize();
  await NotificationService.initialize();
  
  runApp(
    const ProviderScope(
      child: ParentlyApp(),
    ),
  );
}

class ParentlyApp extends ConsumerWidget {
  const ParentlyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    
    return MaterialApp.router(
      title: 'Parently',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
} 