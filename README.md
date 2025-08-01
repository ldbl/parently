# Parently - AI Assistant for Parents and Family Finances

A comprehensive AI-powered platform helping parents and children understand each other better, manage family stress and budget, and provide actionable plans.

## 🏗️ Project Structure

This is a monorepo containing both the backend API and multiple frontend applications:

```
parently/
├── backend/          # Cloudflare Workers API
│   ├── src/         # TypeScript source code
│   ├── migrations/  # Database migrations
│   └── README.md    # Backend documentation
├── frontend/        # Frontend applications
│   ├── mobile/      # Flutter mobile app
│   │   ├── lib/     # Dart source code
│   │   ├── android/ # Android-specific files
│   │   ├── ios/     # iOS-specific files
│   │   └── README.md # Mobile documentation
│   ├── web/         # Hugo web frontend
│   │   └── parently-web/
│   │       ├── content/ # Markdown content
│   │       ├── themes/  # Hugo theme
│   │       └── README.md # Web documentation
│   └── README.md    # Frontend overview
└── README.md        # This file
```

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Mobile App Setup
```bash
cd frontend/mobile
flutter pub get
flutter run
```

### Web Frontend Setup
```bash
cd frontend/web/parently-web
hugo server --buildDrafts --buildFuture
```

## 📋 Features

### For Parents
- **Daily Check-ins**: Morning and evening emotional + financial stress tracking
- **AI Daily Plans**: Personalized parenting and finance advice
- **Free Chat**: Conversational AI support with complexity-based model selection
- **Progress Tracking**: Beautiful line charts showing trends
- **Financial Goals**: Goal setting and progress tracking
- **Child Insights**: AI-generated summaries from children's messages

### For Children
- **Simplified Chat**: Child-friendly AI conversations with emoji support
- **Gamified Tasks**: Homework, social, and financial tasks with reward points
- **Task Management**: Complete tasks and earn points
- **Emoji Picker**: Fun emoji selection for messages

## 🛠️ Technology Stack

### Backend
- **Cloudflare Workers**: Serverless edge computing
- **Cloudflare D1**: Serverless SQL database
- **Cloudflare KV**: Key-value storage for caching
- **TypeScript**: Type-safe development
- **Anthropic Claude API**: AI models (Haiku + Sonnet)
- **JWT**: Secure authentication
- **Zod**: Input validation

### Mobile Frontend (Flutter)
- **Flutter**: Cross-platform mobile development
- **Riverpod**: State management
- **Dio**: HTTP client
- **SQLite**: Local database for offline support
- **Firebase**: Push notifications and analytics
- **FL Chart**: Beautiful data visualization

### Web Frontend (Hugo)
- **Hugo**: Static site generator
- **Bootstrap 5**: CSS framework
- **Chart.js**: Data visualization
- **Vanilla JavaScript**: Interactivity
- **Cloudflare Pages**: Hosting and CDN

## 🔧 Development

### Prerequisites
- Node.js 18+ and npm
- Flutter SDK 3.0+
- Hugo Extended 0.120.0+
- Cloudflare account
- Firebase project
- Anthropic API key

### Environment Setup
1. Clone the repository
2. Set up backend environment variables
3. Configure Firebase for mobile app
4. Install dependencies for all projects

### Running Locally
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Mobile App
cd frontend/mobile
flutter run

# Terminal 3 - Web Frontend
cd frontend/web/parently-web
hugo server --buildDrafts --buildFuture
```

## 📱 Deployment

### Backend Deployment
```bash
cd backend
npm run deploy
```

### Mobile App Deployment
```bash
cd frontend/mobile
flutter build apk --release
flutter build appbundle --release
```

### Web Frontend Deployment
```bash
cd frontend/web/parently-web
hugo --minify
# Deploy to Cloudflare Pages
```

## 🔒 Security

- JWT-based authentication
- Encrypted data storage
- Input validation
- Rate limiting
- Secure API communication

## 📊 Analytics

- Firebase Analytics for user engagement
- Custom event tracking
- Performance monitoring
- Crash reporting

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
- Backend issues: Check `backend/README.md`
- Mobile app issues: Check `frontend/mobile/README.md`
- Web frontend issues: Check `frontend/web/parently-web/README.md`
- Frontend overview: Check `frontend/README.md`
- Create an issue in the repository
- Contact the development team

---

**Parently** - Making family life easier with AI 🤖👨‍👩‍👧‍👦 