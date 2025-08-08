import { Router } from "itty-router";
import { z } from "zod";
import { userRegistrationSchema, userLoginSchema } from "../validation/schemas";
import { DatabaseService } from "../services/database";
import { AuthMiddleware } from "../middleware/auth";
import { RateLimitMiddleware } from "../middleware/rateLimit";
import { CacheService } from "../utils/cache";
import { Env } from "../types";
import bcrypt from "bcryptjs";

export function createAuthRoutes(env: Env) {
  const router = Router();
  const dbService = new DatabaseService(env.DB, env.ENCRYPTION_KEY);
  const authMiddleware = new AuthMiddleware(env);
  const cacheService = new CacheService(env.CACHE);
  const rateLimitMiddleware = new RateLimitMiddleware(cacheService);

  /**
   * POST /auth/register - Register new user
   */
  router.post("/register", async (request: Request) => {
    try {
      // Apply rate limiting using IP address
      const ip =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        "";
      await rateLimitMiddleware.applyRateLimit(request, "general", ip);

      // Validate request body
      const body = await request.json();
      const validatedData = userRegistrationSchema.parse(body);

      // Check if user already exists
      const existingUser = await dbService.getUserByEmail(validatedData.email);
      if (existingUser) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "User with this email already exists",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Validate parent ID if provided
      if (validatedData.parentId) {
        const parent = await dbService.getUserById(validatedData.parentId);
        if (!parent || parent.userType !== "parent") {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Invalid parent ID",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }

      // Hash password and create user
      const passwordHash = await bcrypt.hash(validatedData.password, 10);
      const user = await dbService.createUser({
        email: validatedData.email,
        name: validatedData.name,
        userType: validatedData.userType,
        parentId: validatedData.parentId,
        passwordHash,
      });

      // Generate tokens
      const tokens = authMiddleware.generateTokens({
        id: user.id,
        email: user.email,
        userType: user.userType,
        parentId: user.parentId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              userType: user.userType,
              parentId: user.parentId,
            },
            tokens,
          },
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
   * POST /auth/login - Login user
   */
  router.post("/login", async (request: Request) => {
    try {
      // Apply rate limiting using IP address
      const ip =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        "";
      await rateLimitMiddleware.applyRateLimit(request, "general", ip);

      // Validate request body
      const body = await request.json();
      const validatedData = userLoginSchema.parse(body);

      // Find user by email
      const user = await dbService.getUserByEmail(validatedData.email);
      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid email or user not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid password",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Generate tokens
      const tokens = authMiddleware.generateTokens({
        id: user.id,
        email: user.email,
        userType: user.userType,
        parentId: user.parentId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              userType: user.userType,
              parentId: user.parentId,
            },
            tokens,
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
   * POST /auth/refresh - Refresh access token
   */
  router.post("/refresh", async (request: Request) => {
    try {
      // Apply rate limiting using IP address
      const ip =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        "";
      await rateLimitMiddleware.applyRateLimit(request, "general", ip);

      // Get refresh token from body
      const body = (await request.json()) as { refreshToken?: string };
      const { refreshToken } = body || {};

      if (!refreshToken) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Refresh token is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Refresh token
      const newTokens = await authMiddleware.refreshToken(refreshToken);

      return new Response(
        JSON.stringify({
          success: true,
          data: newTokens,
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
   * GET /auth/me - Get current user info
   */
  router.get("/me", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "general");

      // Get user data
      const user = await dbService.getUserById(authRequest.user!.id);
      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "User not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: user.userType,
            parentId: user.parentId,
            createdAt: user.createdAt,
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
   * POST /auth/logout - Logout user (client-side token removal)
   */
  router.post("/logout", async (request: Request) => {
    try {
      // Authenticate user
      const authRequest = await authMiddleware.authenticate(request);

      // Apply rate limiting
      await rateLimitMiddleware.applyRateLimit(authRequest, "general");

      // Clear user cache
      await cacheService.clearUserCache(authRequest.user!.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Logged out successfully",
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
  console.error("Auth API Error:", error);

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
