# Parently Flutter App

A beautiful and intuitive Flutter application for the Parently AI assistant, designed to help parents and children manage family life and finances together.

## 🚀 Features

### For Parents
- **Daily Check-ins**: Morning and evening emotional + financial stress tracking
- **AI Daily Plans**: Personalized parenting and finance advice
- **Free Chat**: Conversational AI support with complexity-based model selection
- **Progress Tracking**: Beautiful line charts showing emotional and financial trends
- **Financial Goals**: Goal setting and progress tracking
- **Child Insights**: AI-generated summaries from children's messages

### For Children
- **Simplified Chat**: Child-friendly AI conversations with emoji support
- **Gamified Tasks**: Homework, social, and financial tasks with reward points
- **Task Management**: Complete tasks and earn points
- **Emoji Picker**: Fun emoji selection for messages

### Technical Features
- **Offline Support**: SQLite database for offline check-ins and plans
- **Push Notifications**: Firebase Cloud Messaging for check-in reminders
- **Modern UI**: Material Design 3 with beautiful animations
- **State Management**: Riverpod for efficient state management
- **Real-time Updates**: Live data synchronization with the backend

## 📋 Prerequisites

- Flutter SDK 3.0.0 or higher
- Dart SDK 3.0.0 or higher
- Android Studio / VS Code
- Firebase project
- Cloudflare Workers backend (see main README)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd parently/frontend/mobile

# Install Flutter dependencies
flutter pub get
```

### 2. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "Parently"
3. Enable Authentication (Email/Password)
4. Enable Cloud Messaging
5. Enable Analytics (optional)

#### Configure Firebase for Flutter
1. Install FlutterFire CLI:
```bash
dart pub global activate flutterfire_cli
```

2. Configure Firebase for your app:
```bash
flutterfire configure
```

3. Update `lib/firebase_options.dart` with your actual Firebase configuration

#### Android Configuration
1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/`
3. Update `android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'
```

4. Update `android/build.gradle`:
```gradle
classpath 'com.google.gms:google-services:4.3.15'
```

#### iOS Configuration
1. Download `GoogleService-Info.plist` from Firebase Console
2. Add it to your iOS project using Xcode
3. Update `ios/Runner/Info.plist`:
```xml
<key>FirebaseAppDelegateProxyEnabled</key>
<false/>
```

### 3. Backend Configuration

Update the API base URL in `lib/core/services/api_service.dart`:

```dart
static const String baseUrl = 'https://your-worker.your-subdomain.workers.dev';
```

### 4. Generate Code

```bash
# Generate Riverpod providers
flutter packages pub run build_runner build

# Generate JSON serialization
flutter packages pub run build_runner build --delete-conflicting-outputs
```

### 5. Run the App

```bash
# Run on connected device
flutter run

# Run on specific device
flutter run -d <device-id>

# Run in release mode
flutter run --release
```

## 📱 Build Instructions

### Android Build

#### Debug Build
```bash
flutter build apk --debug
```

#### Release Build
```bash
flutter build apk --release
```

#### App Bundle (for Play Store)
```bash
flutter build appbundle --release
```

#### Signing Configuration
1. Create a keystore:
```bash
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

2. Create `android/key.properties`:
```properties
storePassword=<your-store-password>
keyPassword=<your-key-password>
keyAlias=upload
storeFile=<path-to-keystore>/upload-keystore.jks
```

3. Update `android/app/build.gradle`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### iOS Build

#### Debug Build
```bash
flutter build ios --debug
```

#### Release Build
```bash
flutter build ios --release
```

#### Archive for App Store
1. Open Xcode
2. Select Product > Archive
3. Follow the distribution process

## 🔧 Development

### Project Structure
```
lib/
├── core/
│   ├── models/          # Data models
│   ├── providers/       # Riverpod providers
│   ├── services/        # API, database, notifications
│   ├── theme/           # App theme and colors
│   └── routing/         # Navigation configuration
├── features/
│   ├── auth/            # Authentication screens
│   ├── onboarding/      # Onboarding flow
│   ├── parent/          # Parent-specific screens
│   ├── child/           # Child-specific screens
│   └── settings/        # Settings and preferences
└── main.dart            # App entry point
```

### Key Dependencies
- **flutter_riverpod**: State management
- **dio**: HTTP client for API communication
- **sqflite**: Local database for offline support
- **firebase_messaging**: Push notifications
- **fl_chart**: Beautiful charts for progress tracking
- **emoji_picker_flutter**: Emoji selection for children

### Code Generation
```bash
# Watch for changes and regenerate
flutter packages pub run build_runner watch

# Clean and regenerate
flutter packages pub run build_runner clean
flutter packages pub run build_runner build
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Encrypted Storage**: Sensitive data encrypted locally
- **Input Validation**: All user inputs validated
- **Secure API Communication**: HTTPS with proper headers

## 📊 Analytics and Monitoring

### Firebase Analytics
- User engagement tracking
- Feature usage analytics
- Crash reporting
- Performance monitoring

### Custom Events
```dart
// Track check-in completion
FirebaseAnalytics.instance.logEvent(
  name: 'checkin_completed',
  parameters: {
    'type': 'morning',
    'emotional_state': 7,
    'financial_stress': 4,
  },
);
```

## 🧪 Testing

### Unit Tests
```bash
flutter test
```

### Widget Tests
```bash
flutter test test/widget_test.dart
```

### Integration Tests
```bash
flutter drive --target=test_driver/app.dart
```

## 🚀 Deployment

### Android Play Store
1. Build app bundle: `flutter build appbundle --release`
2. Upload to Google Play Console
3. Configure store listing and release

### iOS App Store
1. Archive in Xcode
2. Upload to App Store Connect
3. Configure app metadata and release

## 🔧 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

#### Firebase Issues
1. Verify `google-services.json` is in correct location
2. Check Firebase project configuration
3. Ensure all Firebase services are enabled

#### API Connection Issues
1. Verify backend URL in `api_service.dart`
2. Check network connectivity
3. Verify API endpoints are working

#### Emoji Picker Issues
1. Ensure `emoji_picker_flutter` is properly configured
2. Check platform-specific settings

### Debug Mode
Enable debug logging by setting environment variables:
```bash
flutter run --dart-define=DEBUG=true
```

## 📈 Performance Optimization

- **Image Caching**: Cached network images for better performance
- **Lazy Loading**: Load data on demand
- **Offline Support**: SQLite for offline functionality
- **Memory Management**: Proper disposal of controllers and listeners

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

---

**Parently Flutter App** - Making family life easier with AI 🤖👨‍👩‍👧‍👦 