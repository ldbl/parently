import { Router } from "itty-router";
import { createAuthRoutes } from "./routes/auth";
import { createParentRoutes } from "./routes/parent";
import { createChildrenRoutes } from "./routes/children";
import { Env } from "./types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Create main router
    const router = Router();

    // Determine CORS headers based on allowed origins
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins =
      env.ALLOWED_ORIGINS?.split(",")
        .map((o) => o.trim())
        .filter((o) => o.length > 0) || [];
    const originAllowed = !origin || allowedOrigins.includes(origin);

    const baseCorsHeaders = {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    const corsHeaders =
      originAllowed && origin
        ? { ...baseCorsHeaders, "Access-Control-Allow-Origin": origin }
        : baseCorsHeaders;

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      if (!originAllowed) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Reject requests from disallowed origins
    if (!originAllowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Origin not allowed",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Health check endpoint
    router.get("/health", () => {
      return new Response(
        JSON.stringify({
          status: "healthy",
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    });

    // API version info
    router.get("/api/v1", () => {
      return new Response(
        JSON.stringify({
          name: "Parently API",
          version: "1.0.0",
          description: "AI assistant for parents and family finances",
          endpoints: {
            auth: "/api/v1/auth",
            parent: "/api/v1/parent",
            children: "/api/v1/kids",
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    });

    // Mount route groups (wrap sub-routers' handlers to satisfy types)
    const authRoutes = createAuthRoutes(env);
    const parentRoutes = createParentRoutes(env);
    const childrenRoutes = createChildrenRoutes(env);

    router.all("/api/v1/auth/*", (request: Request, ...args: any[]) =>
      authRoutes.handle(request, ...args),
    );
    router.all("/api/v1/parent/*", (request: Request, ...args: any[]) =>
      parentRoutes.handle(request, ...args),
    );
    router.all("/api/v1/kids/*", (request: Request, ...args: any[]) =>
      childrenRoutes.handle(request, ...args),
    );

    // Catch-all for unmatched routes
    router.all("*", () => {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Endpoint not found",
          availableEndpoints: [
            "GET /health",
            "GET /api/v1",
            "POST /api/v1/auth/register",
            "POST /api/v1/auth/login",
            "POST /api/v1/auth/refresh",
            "GET /api/v1/auth/me",
            "POST /api/v1/auth/logout",
            "POST /api/v1/parent/checkin",
            "GET /api/v1/parent/plan",
            "POST /api/v1/parent/chat",
            "GET /api/v1/parent/progress",
            "GET /api/v1/parent/insights",
            "POST /api/v1/parent/goals",
            "GET /api/v1/parent/goals",
            "POST /api/v1/kids/message",
            "GET /api/v1/kids/tasks",
            "POST /api/v1/kids/tasks/complete",
            "POST /api/v1/kids/tasks",
            "GET /api/v1/kids/messages",
            "GET /api/v1/kids/summary",
          ],
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    });

    try {
      // Handle the request
      const response = await router.handle(request, env, ctx);

      // Add CORS headers to all responses
      if (response) {
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }

      // Fallback 404
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not found",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    } catch (error) {
      console.error("Unhandled error:", error);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }
  },
};
