import { KVNamespace } from '@cloudflare/workers-types';

export class CacheService {
  private kv: KVNamespace;
  private defaultTTL: number = 3600; // 1 hour in seconds

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  /**
   * Generate cache key
   */
  private generateKey(prefix: string, identifier: string, suffix?: string): string {
    return `${prefix}:${identifier}${suffix ? `:${suffix}` : ''}`;
  }

  /**
   * Set cache value with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
      });

      await this.kv.put(key, serializedValue, {
        expirationTtl: ttl || this.defaultTTL,
      });
    } catch (error) {
      console.error('Cache set error:', error);
      // Don't throw error for cache failures
    }
  }

  /**
   * Get cache value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key);
      if (!value) return null;

      const parsed = JSON.parse(value);
      return parsed.data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      // Don't throw error for cache failures
    }
  }

  /**
   * Cache daily plan
   */
  async cacheDailyPlan(userId: string, date: string, plan: any): Promise<void> {
    const key = this.generateKey('plan', userId, date);
    await this.set(key, plan, 86400); // 24 hours
  }

  /**
   * Get cached daily plan
   */
  async getCachedDailyPlan(userId: string, date: string): Promise<any | null> {
    const key = this.generateKey('plan', userId, date);
    return this.get(key);
  }

  /**
   * Cache AI response
   */
  async cacheAIResponse(userId: string, messageHash: string, response: any): Promise<void> {
    const key = this.generateKey('ai_response', userId, messageHash);
    await this.set(key, response, 1800); // 30 minutes
  }

  /**
   * Get cached AI response
   */
  async getCachedAIResponse(userId: string, messageHash: string): Promise<any | null> {
    const key = this.generateKey('ai_response', userId, messageHash);
    return this.get(key);
  }

  /**
   * Cache child insights
   */
  async cacheChildInsights(parentId: string, childId: string, insights: any): Promise<void> {
    const key = this.generateKey('insights', parentId, childId);
    await this.set(key, insights, 7200); // 2 hours
  }

  /**
   * Get cached child insights
   */
  async getCachedChildInsights(parentId: string, childId: string): Promise<any | null> {
    const key = this.generateKey('insights', parentId, childId);
    return this.get(key);
  }

  /**
   * Cache rate limit data
   * @param identifier User ID or IP address
   */
  async cacheRateLimit(identifier: string, endpoint: string, count: number): Promise<void> {
    const key = this.generateKey('rate_limit', identifier, endpoint);
    await this.set(key, { count, timestamp: Date.now() }, 60); // 1 minute
  }

  /**
   * Get rate limit data
   * @param identifier User ID or IP address
   */
  async getRateLimit(identifier: string, endpoint: string): Promise<{ count: number; timestamp: number } | null> {
    const key = this.generateKey('rate_limit', identifier, endpoint);
    return this.get(key);
  }

  /**
   * Clear all cache for a user
   */
  async clearUserCache(userId: string): Promise<void> {
    // Note: KV doesn't support listing keys, so we can't easily clear all user cache
    // This is a limitation of Cloudflare KV
    console.log(`Cache clear requested for user: ${userId}`);
  }

  /**
   * Generate message hash for caching
   */
  generateMessageHash(message: string): string {
    return btoa(message).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }
} 