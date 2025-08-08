import { CacheService } from "../utils/cache";
import { AuthenticatedRequest } from "./auth";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  endpoint: string; // Endpoint identifier
}

export class RateLimitMiddleware {
  private cache: CacheService;

  constructor(cache: CacheService) {
    this.cache = cache;
  }

  private getIdentifier(request: Request, identifier?: string): string | null {
    if ((request as AuthenticatedRequest).user?.id) {
      return (request as AuthenticatedRequest).user!.id;
    }
    if (identifier) return identifier;
    const headerIp =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0];
    return headerIp?.trim() || null;
  }

  /**
   * Check rate limit for user or identifier
   */
  async checkRateLimit(
    request: Request,
    config: RateLimitConfig,
    identifier?: string,
  ): Promise<boolean> {
    const id = this.getIdentifier(request, identifier);
    if (!id) {
      throw new Error("Authentication required for rate limiting");
    }

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get current rate limit data
    const rateLimitData = await this.cache.getRateLimit(id, config.endpoint);

    if (!rateLimitData) {
      // First request in this window
      await this.cache.cacheRateLimit(id, config.endpoint, 1);
      return true;
    }

    // Check if we're in a new window
    if (rateLimitData.timestamp < windowStart) {
      // Reset for new window
      await this.cache.cacheRateLimit(id, config.endpoint, 1);
      return true;
    }

    // Check if limit exceeded
    if (rateLimitData.count >= config.maxRequests) {
      return false;
    }

    // Increment count
    await this.cache.cacheRateLimit(id, config.endpoint, rateLimitData.count + 1);
    return true;
  }

  /**
   * Get rate limit info for user or identifier
   */
  async getRateLimitInfo(
    request: Request,
    config: RateLimitConfig,
    identifier?: string,
  ): Promise<{
    remaining: number;
    reset: number;
    limit: number;
  }> {
    const id = this.getIdentifier(request, identifier);
    if (!id) {
      throw new Error("Authentication required for rate limiting");
    }

    const rateLimitData = await this.cache.getRateLimit(id, config.endpoint);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (!rateLimitData || rateLimitData.timestamp < windowStart) {
      return {
        remaining: config.maxRequests,
        reset: now + config.windowMs,
        limit: config.maxRequests,
      };
    }

    return {
      remaining: Math.max(0, config.maxRequests - rateLimitData.count),
      reset: rateLimitData.timestamp + config.windowMs,
      limit: config.maxRequests,
    };
  }

  /**
   * Standard rate limit configurations
   */
  static getConfigs() {
    return {
      // Chat endpoints - more restrictive
      chat: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        endpoint: "chat",
      },

      // Check-in endpoints - moderate
      checkin: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5,
        endpoint: "checkin",
      },

      // Plan generation - moderate
      plan: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 3,
        endpoint: "plan",
      },

      // Insights generation - more restrictive
      insights: {
        windowMs: 10 * 60 * 1000, // 10 minutes
        maxRequests: 2,
        endpoint: "insights",
      },

      // General API - permissive
      general: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        endpoint: "general",
      },
    };
  }

  /**
   * Apply rate limiting middleware
   */
  async applyRateLimit(
    request: Request,
    configType: keyof ReturnType<typeof RateLimitMiddleware.getConfigs>,
    identifier?: string,
  ): Promise<void> {
    const configs = RateLimitMiddleware.getConfigs();
    const config = configs[configType];

    if (!config) {
      throw new Error(`Unknown rate limit config: ${configType}`);
    }

    const allowed = await this.checkRateLimit(request, config, identifier);

    if (!allowed) {
      const info = await this.getRateLimitInfo(request, config, identifier);
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil((info.reset - Date.now()) / 1000)} seconds`,
      );
    }
  }
}
