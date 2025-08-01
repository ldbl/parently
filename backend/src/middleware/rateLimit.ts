import { CacheService } from '../utils/cache';
import { AuthenticatedRequest } from './auth';

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

  /**
   * Check rate limit for user
   */
  async checkRateLimit(request: AuthenticatedRequest, config: RateLimitConfig): Promise<boolean> {
    if (!request.user) {
      throw new Error('Authentication required for rate limiting');
    }

    const key = `rate_limit:${request.user.id}:${config.endpoint}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get current rate limit data
    const rateLimitData = await this.cache.getRateLimit(request.user.id, config.endpoint);
    
    if (!rateLimitData) {
      // First request in this window
      await this.cache.cacheRateLimit(request.user.id, config.endpoint, 1);
      return true;
    }

    // Check if we're in a new window
    if (rateLimitData.timestamp < windowStart) {
      // Reset for new window
      await this.cache.cacheRateLimit(request.user.id, config.endpoint, 1);
      return true;
    }

    // Check if limit exceeded
    if (rateLimitData.count >= config.maxRequests) {
      return false;
    }

    // Increment count
    await this.cache.cacheRateLimit(request.user.id, config.endpoint, rateLimitData.count + 1);
    return true;
  }

  /**
   * Get rate limit info for user
   */
  async getRateLimitInfo(request: AuthenticatedRequest, config: RateLimitConfig): Promise<{
    remaining: number;
    reset: number;
    limit: number;
  }> {
    if (!request.user) {
      throw new Error('Authentication required for rate limiting');
    }

    const rateLimitData = await this.cache.getRateLimit(request.user.id, config.endpoint);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (!rateLimitData || rateLimitData.timestamp < windowStart) {
      return {
        remaining: config.maxRequests,
        reset: now + config.windowMs,
        limit: config.maxRequests
      };
    }

    return {
      remaining: Math.max(0, config.maxRequests - rateLimitData.count),
      reset: rateLimitData.timestamp + config.windowMs,
      limit: config.maxRequests
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
        endpoint: 'chat'
      },
      
      // Check-in endpoints - moderate
      checkin: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5,
        endpoint: 'checkin'
      },
      
      // Plan generation - moderate
      plan: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 3,
        endpoint: 'plan'
      },
      
      // Insights generation - more restrictive
      insights: {
        windowMs: 10 * 60 * 1000, // 10 minutes
        maxRequests: 2,
        endpoint: 'insights'
      },
      
      // General API - permissive
      general: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        endpoint: 'general'
      }
    };
  }

  /**
   * Apply rate limiting middleware
   */
  async applyRateLimit(request: AuthenticatedRequest, configType: keyof ReturnType<typeof RateLimitMiddleware.getConfigs>): Promise<void> {
    const configs = RateLimitMiddleware.getConfigs();
    const config = configs[configType];

    if (!config) {
      throw new Error(`Unknown rate limit config: ${configType}`);
    }

    const allowed = await this.checkRateLimit(request, config);
    
    if (!allowed) {
      const info = await this.getRateLimitInfo(request, config);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((info.reset - Date.now()) / 1000)} seconds`);
    }
  }
} 