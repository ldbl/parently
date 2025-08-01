# Parently Frontend

Frontend приложения за Parently - AI асистент за родители и семейни финанси.

## 🏗️ Структура

```
frontend/
├── mobile/           # Flutter мобилно приложение
│   ├── lib/         # Dart source code
│   ├── android/     # Android конфигурация
│   ├── ios/         # iOS конфигурация
│   ├── assets/      # Изображения, икони, шрифтове
│   ├── test/        # Тестове
│   ├── pubspec.yaml # Flutter зависимости
│   └── README.md    # Mobile документация
└── web/             # Hugo уеб приложение
    └── parently-web/
        ├── content/ # Markdown съдържание
        ├── themes/  # Hugo тема
        └── README.md # Web документация
```

## 🚀 Quick Start

### Mobile App (Flutter)
```bash
cd mobile
flutter pub get
flutter run
```

### Web App (Hugo)
```bash
cd web/parently-web
hugo server --buildDrafts --buildFuture
```

## 📱 Mobile App

Flutter приложение за Android и iOS с:
- Offline поддръжка
- Push notifications
- Красив Material Design 3 UI
- Riverpod state management

Вижте [mobile/README.md](mobile/README.md) за детайлни инструкции.

## 🌐 Web App

Hugo статичен сайт с:
- Responsive Bootstrap 5 дизайн
- Chart.js визуализации
- API интеграция
- Cloudflare Pages деплой

Вижте [web/parently-web/README.md](web/parently-web/README.md) за детайлни инструкции.

## 🔧 Development

### Предварителни изисквания
- Flutter SDK 3.0+
- Hugo Extended 0.120.0+
- Node.js 18+
- Firebase проект
- Cloudflare акаунт

### Паралелна разработка
```bash
# Terminal 1 - Mobile
cd mobile
flutter run

# Terminal 2 - Web
cd web/parently-web
hugo server --buildDrafts --buildFuture

# Terminal 3 - Backend (от root директорията)
cd backend
npm run dev
```

## 📱 Деплой

### Mobile App
```bash
cd mobile
flutter build apk --release
flutter build appbundle --release
```

### Web App
```bash
cd web/parently-web
hugo --minify
# Deploy to Cloudflare Pages
```

## 🤝 Contributing

1. Fork репозиторията
2. Създайте feature branch
3. Направете промените
4. Добавете тестове ако е нужно
5. Submit pull request

## 📄 License

Този проект е proprietary software. Всички права запазени. 