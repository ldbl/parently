import { JWTService } from "../utils/jwt";
import { DatabaseService } from "../services/database";
import { Env } from "../types";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: "parent" | "child";
    parentId?: string;
  };
}

export class AuthMiddleware {
  private jwtService: JWTService;
  private dbService: DatabaseService;

  constructor(env: Env) {
    this.jwtService = new JWTService(env.JWT_SECRET);
    this.dbService = new DatabaseService(env.DB, env.ENCRYPTION_KEY);
  }

  /**
   * Authenticate user with JWT token
   */
  async authenticate(request: Request): Promise<AuthenticatedRequest> {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    try {
      const token = this.jwtService.extractTokenFromHeader(authHeader);
      const payload = this.jwtService.verifyAccessToken(token);

      // Verify user still exists in database
      const user = await this.dbService.getUserById(payload.userId);
      if (!user) {
        throw new Error("User not found");
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: payload.userId,
        email: payload.email,
        userType: payload.userType,
        parentId: payload.parentId,
      };

      return authenticatedRequest;
    } catch (error) {
      throw new Error(
        `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Require parent role
   */
  async requireParent(request: AuthenticatedRequest): Promise<void> {
    if (!request.user) {
      throw new Error("Authentication required");
    }

    if (request.user.userType !== "parent") {
      throw new Error("Parent access required");
    }
  }

  /**
   * Require child role
   */
  async requireChild(request: AuthenticatedRequest): Promise<void> {
    if (!request.user) {
      throw new Error("Authentication required");
    }

    if (request.user.userType !== "child") {
      throw new Error("Child access required");
    }
  }

  /**
   * Require specific user or parent access
   */
  async requireUserOrParent(request: AuthenticatedRequest, userId: string): Promise<void> {
    if (!request.user) {
      throw new Error("Authentication required");
    }

    // User can access their own data
    if (request.user.id === userId) {
      return;
    }

    // Parent can access their children's data
    if (request.user.userType === "parent") {
      const children = await this.dbService.getChildrenByParentId(request.user.id);
      const childIds = children.map((child) => child.id);

      if (childIds.includes(userId)) {
        return;
      }
    }

    throw new Error("Access denied");
  }

  /**
   * Generate tokens for user
   */
  generateTokens(user: {
    id: string;
    email: string;
    userType: "parent" | "child";
    parentId?: string;
  }) {
    const accessToken = this.jwtService.generateAccessToken({
      userId: user.id,
      email: user.email,
      userType: user.userType,
      parentId: user.parentId,
    });
    const refreshToken = this.jwtService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes
      refreshExpiresIn: 7 * 24 * 60 * 60, // 7 days
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const { userId } = this.jwtService.verifyRefreshToken(refreshToken);
      const user = await this.dbService.getUserById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      const accessToken = this.jwtService.generateAccessToken({
        userId: user.id,
        email: user.email,
        userType: user.userType,
        parentId: user.parentId,
      });

      return {
        accessToken,
        expiresIn: 15 * 60, // 15 minutes
      };
    } catch (error) {
      throw new Error(
        `Token refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
