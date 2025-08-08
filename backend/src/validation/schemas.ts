import { z } from "zod";

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  userType: z.enum(["parent", "child"], { required_error: "User type is required" }),
  parentId: z.string().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Check-in validation schemas
export const checkinSchema = z.object({
  checkinType: z.enum(["morning", "evening"], { required_error: "Check-in type is required" }),
  emotionalState: z
    .number()
    .int()
    .min(1, "Emotional state must be 1-10")
    .max(10, "Emotional state must be 1-10"),
  financialStress: z
    .number()
    .int()
    .min(1, "Financial stress must be 1-10")
    .max(10, "Financial stress must be 1-10"),
  notes: z.string().max(1000, "Notes too long").optional(),
  unexpectedExpenses: z.number().min(0, "Expenses cannot be negative").optional(),
});

// Chat validation schemas
export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
});

export const childMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
});

// Task validation schemas
export const taskCompleteSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(200, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  taskType: z.enum(["homework", "social", "financial"], {
    required_error: "Task type is required",
  }),
  points: z
    .number()
    .int()
    .min(1, "Points must be at least 1")
    .max(100, "Points too high")
    .optional(),
});

// Financial goals validation schemas
export const financialGoalSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(200, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  targetAmount: z.number().positive("Target amount must be positive"),
  goalType: z.enum(["savings", "activity", "emergency"], {
    required_error: "Goal type is required",
  }),
  targetDate: z.string().datetime("Invalid date format").optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
});

// Rate limiting schemas
export const rateLimitSchema = z.object({
  userId: z.string(),
  endpoint: z.string(),
  timestamp: z.number(),
});

// AI request schemas
export const aiComplexityRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

export const aiPlanRequestSchema = z.object({
  userContext: z.object({
    recentCheckins: z.array(
      z.object({
        emotionalState: z.number(),
        financialStress: z.number(),
        notes: z.string().optional(),
      }),
    ),
    currentGoals: z.array(z.string()).optional(),
    familySituation: z.string().optional(),
  }),
});

export const aiInsightRequestSchema = z.object({
  childMessages: z.array(
    z.object({
      message: z.string(),
      timestamp: z.string(),
    }),
  ),
  parentCheckins: z.array(
    z.object({
      emotionalState: z.number(),
      financialStress: z.number(),
      timestamp: z.string(),
    }),
  ),
});

// Response schemas
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});

export const errorResponseSchema = z.object({
  success: z.boolean(),
  error: z.string(),
  code: z.string().optional(),
});

// JWT token schemas
export const jwtPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  userType: z.enum(["parent", "child"]),
  parentId: z.string().optional(),
  iat: z.number(),
  exp: z.number(),
});

// Cache key schemas
export const cacheKeySchema = z.object({
  userId: z.string(),
  type: z.enum(["plan", "insights", "chat"]),
  date: z.string().optional(),
});
