import { Router } from "itty-router";
import { z } from "zod";
import { childMessageSchema, taskCompleteSchema, createTaskSchema } from "../validation/schemas";
import { DatabaseService } from "../services/database";
import { AIService } from "../services/ai";
import { CacheService } from "../utils/cache";
import { AuthMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { RateLimitMiddleware } from "../middleware/rateLimit";
import { Env } from "../types";

export function createChildrenRoutes(env: Env) {
  const router = Router();
  const dbService = new DatabaseService(env.DB, env.ENCRYPTION_KEY);
  const aiService = new AIService(env.ANTHROPIC_API_KEY);
  const cacheService = new CacheService(env.CACHE);
  const authMiddleware = new AuthMiddleware(env);
  const rateLimitMiddleware = new RateLimitMiddleware(cacheService);

  /**
   * POST /kids/message - Send message to AI (simplified chat)
   */
  router.post("/kids/message", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireChild(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "chat");

      // Validate request body
      const body = await request.json();
      const validatedData = childMessageSchema.parse(body);

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

      // Create child-friendly prompt
      const childPrompt = `You are Parently, a friendly AI assistant for children. 
The child is asking: "${validatedData.message}"

Respond in a warm, encouraging, and age-appropriate way. Keep it simple and positive.
If they're asking about money or family, give simple, helpful advice.
Use emojis occasionally to make it friendly.`;

      // Get AI response using Haiku for simplicity
      const aiResponse = await aiService.handleChat(childPrompt);

      // Cache the response
      await cacheService.cacheAIResponse(authRequest.user!.id, messageHash, aiResponse);

      // Store in database
      await dbService.createChildMessage({
        userId: authRequest.user!.id,
        message: validatedData.message,
        aiResponse: aiResponse.response,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            response: aiResponse.response,
            model: aiResponse.model,
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
   * GET /kids/tasks - Get child's tasks and points
   */
  router.get("/kids/tasks", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireChild(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "general");

      // Get query parameters
      const url = new URL(request.url);
      const completed = url.searchParams.get("completed");

      let tasks;
      if (completed !== null) {
        tasks = await dbService.getChildTasks(authRequest.user!.id, completed === "true");
      } else {
        tasks = await dbService.getChildTasks(authRequest.user!.id);
      }

      // Calculate total points
      const totalPoints = tasks.reduce((sum, task) => sum + (task.completed ? task.points : 0), 0);
      const availablePoints = tasks.reduce(
        (sum, task) => sum + (task.completed ? 0 : task.points),
        0,
      );

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            tasks,
            points: {
              total: totalPoints,
              available: availablePoints,
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
   * POST /kids/tasks/complete - Mark task as completed
   */
  router.post("/kids/tasks/complete", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireChild(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "general");

      // Validate request body
      const body = await request.json();
      const validatedData = taskCompleteSchema.parse(body);

      // Complete the task
      await dbService.completeTask(validatedData.taskId);

      // Get the task to return points earned
      const tasks = await dbService.getChildTasks(authRequest.user!.id);
      const completedTask = tasks.find((task) => task.id === validatedData.taskId);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "Task completed successfully!",
            pointsEarned: completedTask?.points || 0,
            taskId: validatedData.taskId,
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
   * POST /kids/tasks - Create new task (for parents)
   */
  router.post("/kids/tasks", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireParent(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "general");

      // Validate request body
      const body = await request.json();
      const validatedData = createTaskSchema.parse(body);

      // Get child ID from query params
      const url = new URL(request.url);
      const childId = url.searchParams.get("childId");

      if (!childId) {
        throw new Error("Child ID is required");
      }

      // Verify parent has access to this child
      await authMiddleware.requireUserOrParent(authRequest, childId);

      // Create task
      const task = await dbService.createChildTask({
        userId: childId,
        title: validatedData.title,
        description: validatedData.description,
        taskType: validatedData.taskType,
        points: validatedData.points || 10,
        completed: false,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: task,
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
   * GET /kids/messages - Get child's message history (for parents)
   */
  router.get("/kids/messages", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireParent(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "general");

      // Get child ID from query params
      const url = new URL(request.url);
      const childId = url.searchParams.get("childId");
      const limit = parseInt(url.searchParams.get("limit") || "20");

      if (!childId) {
        throw new Error("Child ID is required");
      }

      // Verify parent has access to this child
      await authMiddleware.requireUserOrParent(authRequest, childId);

      // Get child messages
      const messages = await dbService.getChildMessages(childId, limit);

      return new Response(
        JSON.stringify({
          success: true,
          data: messages,
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
   * GET /kids/summary - Get child's activity summary (for parents)
   */
  router.get("/kids/summary", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);
      await authMiddleware.requireParent(authRequest);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "general");

      // Get child ID from query params
      const url = new URL(request.url);
      const childId = url.searchParams.get("childId");

      if (!childId) {
        throw new Error("Child ID is required");
      }

      // Verify parent has access to this child
      await authMiddleware.requireUserOrParent(authRequest, childId);

      // Get child data
      const [tasks, messages] = await Promise.all([
        dbService.getChildTasks(childId),
        dbService.getChildMessages(childId, 10),
      ]);

      // Calculate summary
      const completedTasks = tasks.filter((task) => task.completed);
      const totalPoints = completedTasks.reduce((sum, task) => sum + task.points, 0);
      const recentMessages = messages.slice(0, 5);

      const summary = {
        childId,
        tasks: {
          total: tasks.length,
          completed: completedTasks.length,
          pending: tasks.length - completedTasks.length,
        },
        points: {
          total: totalPoints,
          available: tasks.reduce((sum, task) => sum + (task.completed ? 0 : task.points), 0),
        },
        recentActivity: {
          lastMessage: messages[0]?.createdAt || null,
          messageCount: messages.length,
          recentMessages: recentMessages.map((m) => ({
            message: m.message.substring(0, 50) + (m.message.length > 50 ? "..." : ""),
            timestamp: m.createdAt,
          })),
        },
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: summary,
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
  console.error("Children API Error:", error);

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
