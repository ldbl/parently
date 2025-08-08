import { Router } from "itty-router";
import { z } from "zod";
import {
  checkinSchema,
  chatMessageSchema,
  paginationSchema,
  dateRangeSchema,
  financialGoalSchema,
} from "../validation/schemas";
import { DatabaseService } from "../services/database";
import { AIService } from "../services/ai";
import { CacheService } from "../utils/cache";
import { AuthMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { RateLimitMiddleware } from "../middleware/rateLimit";
import { Env } from "../types";

export function createParentRoutes(env: Env) {
  const router = Router();
  const dbService = new DatabaseService(env.DB, env.ENCRYPTION_KEY);
  const aiService = new AIService(env.ANTHROPIC_API_KEY);
  const cacheService = new CacheService(env.CACHE);
  const authMiddleware = new AuthMiddleware(env);
  const rateLimitMiddleware = new RateLimitMiddleware(cacheService);

  /**
   * POST /checkin - Record emotional and financial check-in
   */
  router.post("/checkin", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireParent(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "checkin");

      // Validate request body
      const body = await request.json();
      const validatedData = checkinSchema.parse(body);

      // Create check-in
      const checkin = await dbService.createCheckin({
        userId: authRequest.user!.id,
        checkinType: validatedData.checkinType,
        emotionalState: validatedData.emotionalState,
        financialStress: validatedData.financialStress,
        notes: validatedData.notes,
        unexpectedExpenses: validatedData.unexpectedExpenses || 0,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: checkin,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      return handleError(error);
    }
  });

  /**
   * GET /plan - Get daily AI plan (cached)
   */
  router.get("/plan", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireParent(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "plan");

      // Get date from query params
      const url = new URL(request.url);
      const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];

      // Check cache first
      const cachedPlan = await cacheService.getCachedDailyPlan(authRequest.user!.id, date);
      if (cachedPlan) {
        return new Response(
          JSON.stringify({
            success: true,
            data: cachedPlan,
            cached: true,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Get recent check-ins for context
      const recentCheckins = await dbService.getRecentCheckins(authRequest.user!.id, 5);

      // Generate new plan
      const plan = await aiService.generatePlan({
        recentCheckins: recentCheckins.map((c) => ({
          emotionalState: c.emotionalState,
          financialStress: c.financialStress,
          notes: c.notes,
        })),
      });

      // Cache the plan
      await cacheService.cacheDailyPlan(authRequest.user!.id, date, plan);

      // Store in database
      await dbService.createDailyPlan({
        userId: authRequest.user!.id,
        planContent: JSON.stringify(plan),
        planDate: date,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: plan,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      return handleError(error);
    }
  });

  /**
   * POST /chat - Free chat with AI
   */
  router.post("/chat", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireParent(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "chat");

      // Validate request body
      const body = await request.json();
      const validatedData = chatMessageSchema.parse(body);

      // Check cache for similar messages
      const messageHash = cacheService.generateMessageHash(validatedData.message);
      const cachedResponse = await cacheService.getCachedAIResponse(
        authRequest.user!.id,
        messageHash,
      );

      if (cachedResponse) {
        return new Response(
          JSON.stringify({
            success: true,
            data: cachedResponse,
            cached: true,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Get user context from recent check-ins
      const recentCheckins = await dbService.getRecentCheckins(authRequest.user!.id, 3);
      const context =
        recentCheckins.length > 0
          ? `Recent emotional state: ${recentCheckins[0].emotionalState}/10, Financial stress: ${recentCheckins[0].financialStress}/10`
          : undefined;

      // Get AI response
      const aiResponse = await aiService.handleChat(validatedData.message, context);

      // Cache the response
      await cacheService.cacheAIResponse(authRequest.user!.id, messageHash, aiResponse);

      // Store in database
      await dbService.createChatMessage({
        userId: authRequest.user!.id,
        message: validatedData.message,
        response: aiResponse.response,
        complexityScore: aiResponse.complexityScore,
        aiModel: aiResponse.model,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: aiResponse,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      return handleError(error);
    }
  });

  /**
   * GET /progress - Get progress history and charts
   */
  router.get("/progress", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireParent(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "general");

      // Get query parameters
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");

      // Get recent check-ins
      const checkins = await dbService.getRecentCheckins(authRequest.user!.id, limit);

      // Get chat history
      const chatHistory = await dbService.getChatHistory(authRequest.user!.id, limit);

      // Calculate trends
      const emotionalTrend = checkins.map((c) => ({
        date: c.createdAt,
        value: c.emotionalState,
      }));

      const financialTrend = checkins.map((c) => ({
        date: c.createdAt,
        value: c.financialStress,
      }));

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            checkins,
            chatHistory,
            trends: {
              emotional: emotionalTrend,
              financial: financialTrend,
            },
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      return handleError(error);
    }
  });

  /**
   * GET /insights - Get AI insights from children
   */
  router.get("/insights", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireParent(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "insights");

      // Get children
      const children = await dbService.getChildrenByParentId(authRequest.user!.id);

      const insights = [];

      for (const child of children) {
        // Check cache first
        const cachedInsights = await cacheService.getCachedChildInsights(
          authRequest.user!.id,
          child.id,
        );

        if (cachedInsights) {
          insights.push({
            childId: child.id,
            childName: child.name,
            insights: cachedInsights,
            cached: true,
          });
          continue;
        }

        // Get child messages
        const childMessages = await dbService.getChildMessages(child.id, 20);

        // Get parent check-ins for correlation
        const parentCheckins = await dbService.getRecentCheckins(authRequest.user!.id, 10);

        if (childMessages.length > 0) {
          // Generate insights
          const aiInsights = await aiService.generateChildInsights({
            childMessages: childMessages.map((m) => ({
              message: m.message,
              timestamp: m.createdAt,
            })),
            parentCheckins: parentCheckins.map((c) => ({
              emotionalState: c.emotionalState,
              financialStress: c.financialStress,
              timestamp: c.createdAt,
            })),
          });

          // Cache insights
          await cacheService.cacheChildInsights(authRequest.user!.id, child.id, aiInsights);

          // Store in database
          await dbService.createChildInsight({
            parentId: authRequest.user!.id,
            childId: child.id,
            insightContent: aiInsights.summary,
            recommendations: aiInsights.recommendations.join("; "),
            insightDate: new Date().toISOString().split("T")[0],
          });

          insights.push({
            childId: child.id,
            childName: child.name,
            insights: aiInsights,
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: insights,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      return handleError(error);
    }
  });

  /**
   * POST /goals - Create financial goal
   */
  router.post("/goals", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireParent(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "general");

      // Validate request body
      const body = await request.json();
      const validatedData = financialGoalSchema.parse(body);

      // Create financial goal
      const goal = await dbService.createFinancialGoal({
        userId: authRequest.user!.id,
        title: validatedData.title,
        description: validatedData.description,
        targetAmount: validatedData.targetAmount,
        currentAmount: 0,
        goalType: validatedData.goalType,
        targetDate: validatedData.targetDate,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: goal,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      return handleError(error);
    }
  });

  /**
   * GET /goals - Get financial goals
   */
  router.get("/goals", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireParent(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "general");

      // Get financial goals
      const goals = await dbService.getFinancialGoals(authRequest.user!.id);

      return new Response(
        JSON.stringify({
          success: true,
          data: goals,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      return handleError(error);
    }
  });

  return router;
}

function handleError(error: unknown): Response {
  console.error("API Error:", error);

  let message = "Internal server error";
  let status = 500;

  if (error instanceof z.ZodError) {
    message = "Validation error: " + error.errors.map((e) => e.message).join(", ");
    status = 400;
  } else if (error instanceof Error) {
    message = error.message;
    if (message.includes("Authentication")) status = 401;
    else if (message.includes("Access denied")) status = 403;
    else if (message.includes("Rate limit")) status = 429;
    else if (message.includes("not found")) status = 404;
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}
