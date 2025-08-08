export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'parent' | 'child';
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentCheckin {
  id: string;
  userId: string;
  checkinType: 'morning' | 'evening';
  emotionalState: number; // 1-10
  financialStress: number; // 1-10
  notes?: string;
  unexpectedExpenses: number;
  createdAt: string;
}

export interface DailyPlan {
  id: string;
  userId: string;
  planContent: string;
  planDate: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  response: string;
  complexityScore?: number; // 1-5
  aiModel: 'haiku' | 'sonnet';
  createdAt: string;
}

export interface ChildTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  taskType: 'homework' | 'social' | 'financial';
  points: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface ChildMessage {
  id: string;
  userId: string;
  message: string;
  aiResponse: string;
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  goalType: 'savings' | 'activity' | 'emergency';
  targetDate?: string;
  createdAt: string;
}

export interface ChildInsight {
  id: string;
  parentId: string;
  childId: string;
  insightContent: string;
  recommendations?: string;
  insightDate: string;
  createdAt: string;
}

// API Request/Response types
export interface CheckinRequest {
  checkinType: 'morning' | 'evening';
  emotionalState: number;
  financialStress: number;
  notes?: string;
  unexpectedExpenses?: number;
}

export interface ChatRequest {
  message: string;
}

export interface ChildMessageRequest {
  message: string;
}

export interface TaskCompleteRequest {
  taskId: string;
}

export interface FinancialGoalRequest {
  title: string;
  description?: string;
  targetAmount: number;
  goalType: 'savings' | 'activity' | 'emergency';
  targetDate?: string;
}

// AI Response types
export interface AIComplexityEvaluation {
  complexityScore: number; // 1-5
  reasoning: string;
}

export interface AIDailyPlan {
  plan: string;
  focusAreas: string[];
  tips: string[];
}

export interface AIChatResponse {
  response: string;
  model: 'haiku' | 'sonnet';
  complexityScore: number;
}

export interface AIChildInsight {
  summary: string;
  emotionalState: string;
  concerns: string[];
  recommendations: string[];
  suggestedActions: string[];
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  userType: 'parent' | 'child';
  parentId?: string;
  iat: number;
  exp: number;
}

// Environment variables
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  ANTHROPIC_API_KEY: string;
  ENVIRONMENT: string;
  ALLOWED_ORIGINS: string;
}
