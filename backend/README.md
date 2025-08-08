# Parently - AI Assistant for Parents and Family Finances

Parently is an AI-powered assistant that helps parents and children better understand each other, manage family stress and budget, and provides actionable plans.

## 🚀 Features

### For Parents
- **Daily Check-ins**: Morning and evening emotional + financial stress tracking
- **AI Daily Plans**: Personalized parenting and finance advice
- **Free Chat**: Conversational AI support (Haiku/Sonnet based on complexity)
- **Financial Module**: Daily financial check-ins, expense tracking, and insights
- **Child Insights**: AI-generated summaries from children's messages + recommendations
- **Family Goals**: Savings, activity budgets, and financial planning

### For Children
- **Simplified Chat**: Child-friendly AI conversations with emojis
- **Gamification**: Tasks (homework, social, financial) with reward points
- **Financial Education**: Mini-tasks related to pocket money and savings

## 🏗️ Architecture

- **Backend**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV
- **Authentication**: JWT with refresh tokens
- **AI**: Anthropic Claude API (Haiku + Sonnet)
- **Security**: AES encryption for sensitive data, input validation with Zod

## 📋 Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Anthropic API key
- Wrangler CLI

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 3. Login to Cloudflare

```bash
wrangler login
```

### 4. Create D1 Database

```bash
# Create the database
wrangler d1 create parently-db

# Apply migrations
wrangler d1 migrations apply parently-db
```

### 5. Create KV Namespace

```bash
wrangler kv:namespace create PARENTLY_CACHE
```

### 6. Configure Environment

Update `wrangler.toml` with your actual values, including the list of allowed CORS domains:

```toml
[vars]
ENVIRONMENT = "development"
ALLOWED_ORIGINS = "http://localhost:3000"

[[env.production.d1_databases]]
binding = "DB"
database_name = "parently-db"
database_id = "your-actual-database-id"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-actual-kv-namespace-id"

[env.production.vars]
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "https://your-production-domain.com"
JWT_SECRET = "your-secure-jwt-secret"
ENCRYPTION_KEY = "your-secure-encryption-key"
ANTHROPIC_API_KEY = "your-anthropic-api-key"
```

`ALLOWED_ORIGINS` accepts a comma-separated list of domains. Requests from origins not in this list will receive a `403` response.

### 7. Deploy

```bash
# Deploy to production
wrangler deploy

# Or deploy to staging
wrangler deploy --env staging
```

## 🔧 Development

### Local Development

```bash
# Start local development server
npm run dev
```

### Database Migrations

```bash
# Create new migration
wrangler d1 migrations create parently-db migration_name

# Apply migrations
wrangler d1 migrations apply parently-db
```

## 📚 API Documentation

### Authentication

All endpoints except `/health`, `/api/v1`, and `/api/v1/auth/*` require authentication via Bearer token.

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "parent@example.com",
  "name": "John Doe",
  "userType": "parent"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "parent@example.com"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Parent Endpoints

#### Create Check-in
```http
POST /api/v1/parent/checkin
Authorization: Bearer <token>
Content-Type: application/json

{
  "checkinType": "morning",
  "emotionalState": 7,
  "financialStress": 4,
  "notes": "Feeling good today",
  "unexpectedExpenses": 0
}
```

#### Get Daily Plan
```http
GET /api/v1/parent/plan?date=2024-01-15
Authorization: Bearer <token>
```

#### Chat with AI
```http
POST /api/v1/parent/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "How can I help my child understand money better?"
}
```

#### Get Progress
```http
GET /api/v1/parent/progress?limit=10
Authorization: Bearer <token>
```

#### Get Child Insights
```http
GET /api/v1/parent/insights
Authorization: Bearer <token>
```

#### Create Financial Goal
```http
POST /api/v1/parent/goals
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Family Vacation",
  "description": "Save for summer vacation",
  "targetAmount": 5000,
  "goalType": "savings",
  "targetDate": "2024-07-01"
}
```

### Children Endpoints

#### Send Message
```http
POST /api/v1/kids/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "How are you today?"
}
```

#### Get Tasks
```http
GET /api/v1/kids/tasks?completed=false
Authorization: Bearer <token>
```

#### Complete Task
```http
POST /api/v1/kids/tasks/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskId": "task-uuid"
}
```

#### Create Task (Parent)
```http
POST /api/v1/kids/tasks?childId=child-uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Do homework",
  "description": "Complete math assignment",
  "taskType": "homework",
  "points": 15
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **AES Encryption**: All sensitive data (notes, messages) are encrypted
- **Input Validation**: Zod schemas validate all input data
- **Rate Limiting**: Prevents API abuse with configurable limits
- **CORS**: Proper CORS headers for web client support

## 🚦 Rate Limits

- **Chat**: 10 requests per minute
- **Check-ins**: 5 requests per minute
- **Plan Generation**: 3 requests per 5 minutes
- **Insights**: 2 requests per 10 minutes
- **General API**: 30 requests per minute

## 💰 Monetization Strategy

### Freemium Model
- **Free Tier**: Basic plans and chat functionality
- **Premium Tier** (~10-15€/month): Financial module, family goals, child accounts

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test specific endpoint
curl -X POST https://your-worker.your-subdomain.workers.dev/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","userType":"parent"}'
```

## 📊 Monitoring

- Cloudflare Analytics for request metrics
- Error logging via `console.error`
- Rate limit tracking in KV storage

## 🔄 Deployment Workflow

1. **Development**: Local testing with `wrangler dev`
2. **Staging**: Deploy to staging environment for testing
3. **Production**: Deploy to production after validation

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection**: Ensure D1 database is created and migrations applied
2. **KV Access**: Verify KV namespace exists and is properly configured
3. **Environment Variables**: Check all required env vars are set in `wrangler.toml`
4. **CORS Issues**: Verify CORS headers are properly set for your domain and that it is included in `ALLOWED_ORIGINS`

### Debug Mode

Enable debug logging by setting `ENVIRONMENT=development` in your environment variables.

## 📈 Performance

- **Response Time**: < 200ms for cached responses
- **AI Response**: < 10s with retry logic
- **Database**: Optimized queries with proper indexing
- **Caching**: KV cache for plans, AI responses, and insights

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

**Parently** - Making family life easier with AI 🤖👨‍👩‍👧‍👦 
