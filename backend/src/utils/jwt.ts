import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

export class JWTService {
  private secret: string;
  private refreshSecret: string;

  constructor(jwtSecret: string) {
    this.secret = jwtSecret;
    this.refreshSecret = jwtSecret + '_refresh';
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const tokenPayload: JWTPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    };

    return jwt.sign(tokenPayload, this.secret, { algorithm: 'HS256' });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string): string {
    const payload = {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    };

    return jwt.sign(payload, this.refreshSecret, { algorithm: 'HS256' });
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.refreshSecret, { algorithms: ['HS256'] }) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw new Error('Refresh token verification failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken: string, userData: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const { userId } = this.verifyRefreshToken(refreshToken);
    
    if (userId !== userData.userId) {
      throw new Error('Token mismatch');
    }

    return this.generateAccessToken(userData);
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }

    return authHeader.substring(7);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }
} 