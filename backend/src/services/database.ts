import { D1Database } from '@cloudflare/workers-types';
import { 
  User, 
  ParentCheckin, 
  DailyPlan, 
  ChatMessage, 
  ChildTask, 
  ChildMessage, 
  FinancialGoal, 
  ChildInsight 
} from '../types';
import { EncryptionService } from '../utils/encryption';

export class DatabaseService {
  private db: D1Database;
  private encryption: EncryptionService;

  constructor(db: D1Database, encryptionKey: string) {
    this.db = db;
    this.encryption = new EncryptionService(encryptionKey);
  }

  /**
   * User operations
   */
  async createUser(
    user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { passwordHash: string }
  ): Promise<User> {
    const id = this.encryption.generateSecureId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, name, password_hash, user_type, parent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      id,
      user.email,
      user.name,
      user.passwordHash,
      user.userType,
      user.parentId || null,
      now,
      now
    ).run();

    return {
      id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      parentId: user.parentId,
      createdAt: now,
      updatedAt: now
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const result = await stmt.bind(id).first();
    return result as User | null;
  }

  async getUserByEmail(
    email: string
  ): Promise<(User & { passwordHash: string }) | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    const result: any = await stmt.bind(email).first();
    if (!result) return null;
    return {
      id: result.id as string,
      email: result.email as string,
      name: result.name as string,
      userType: result.user_type as 'parent' | 'child',
      parentId: result.parent_id as string | undefined,
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string,
      passwordHash: result.password_hash as string
    };
  }

  async getChildrenByParentId(parentId: string): Promise<User[]> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE parent_id = ? AND user_type = "child"');
    const result = await stmt.bind(parentId).all();
    return result.results as User[];
  }

  /**
   * Check-in operations
   */
  async createCheckin(checkin: Omit<ParentCheckin, 'id' | 'createdAt'>): Promise<ParentCheckin> {
    const id = this.encryption.generateSecureId();
    const now = new Date().toISOString();
    const notesEncrypted = checkin.notes ? this.encryption.encrypt(checkin.notes) : null;

    const stmt = this.db.prepare(`
      INSERT INTO parent_checkins (id, user_id, checkin_type, emotional_state, financial_stress, notes_encrypted, unexpected_expenses, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      id, 
      checkin.userId, 
      checkin.checkinType, 
      checkin.emotionalState, 
      checkin.financialStress, 
      notesEncrypted, 
      checkin.unexpectedExpenses, 
      now
    ).run();

    return {
      id,
      userId: checkin.userId,
      checkinType: checkin.checkinType,
      emotionalState: checkin.emotionalState,
      financialStress: checkin.financialStress,
      notes: checkin.notes,
      unexpectedExpenses: checkin.unexpectedExpenses,
      createdAt: now
    };
  }

  async getRecentCheckins(userId: string, limit: number = 10): Promise<ParentCheckin[]> {
    const stmt = this.db.prepare(`
      SELECT id, user_id, checkin_type, emotional_state, financial_stress, notes_encrypted, unexpected_expenses, created_at
      FROM parent_checkins 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);

    const result = await stmt.bind(userId, limit).all();
    
    return result.results.map(row => ({
      id: row.id as string,
      userId: row.user_id as string,
      checkinType: row.checkin_type as 'morning' | 'evening',
      emotionalState: row.emotional_state as number,
      financialStress: row.financial_stress as number,
      notes: row.notes_encrypted ? this.encryption.decrypt(row.notes_encrypted as string) : undefined,
      unexpectedExpenses: row.unexpected_expenses as number,
      createdAt: row.created_at as string
    }));
  }

  /**
   * Daily plan operations
   */
  async createDailyPlan(plan: Omit<DailyPlan, 'id' | 'createdAt'>): Promise<DailyPlan> {
    const id = this.encryption.generateSecureId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO daily_plans (id, user_id, plan_content, plan_date, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    await stmt.bind(id, plan.userId, plan.planContent, plan.planDate, now).run();

    return {
      id,
      userId: plan.userId,
      planContent: plan.planContent,
      planDate: plan.planDate,
      createdAt: now
    };
  }

  async getDailyPlan(userId: string, date: string): Promise<DailyPlan | null> {
    const stmt = this.db.prepare('SELECT * FROM daily_plans WHERE user_id = ? AND plan_date = ?');
    const result = await stmt.bind(userId, date).first();
    return result as DailyPlan | null;
  }

  /**
   * Chat operations
   */
  async createChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const id = this.encryption.generateSecureId();
    const now = new Date().toISOString();
    const messageEncrypted = this.encryption.encrypt(message.message);
    const responseEncrypted = this.encryption.encrypt(message.response);

    const stmt = this.db.prepare(`
      INSERT INTO chat_messages (id, user_id, message_encrypted, response_encrypted, complexity_score, ai_model, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      id, 
      message.userId, 
      messageEncrypted, 
      responseEncrypted, 
      message.complexityScore || null, 
      message.aiModel, 
      now
    ).run();

    return {
      id,
      userId: message.userId,
      message: message.message,
      response: message.response,
      complexityScore: message.complexityScore,
      aiModel: message.aiModel,
      createdAt: now
    };
  }

  async getChatHistory(userId: string, limit: number = 20): Promise<ChatMessage[]> {
    const stmt = this.db.prepare(`
      SELECT id, user_id, message_encrypted, response_encrypted, complexity_score, ai_model, created_at
      FROM chat_messages 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);

    const result = await stmt.bind(userId, limit).all();
    
    return result.results.map(row => ({
      id: row.id as string,
      userId: row.user_id as string,
      message: this.encryption.decrypt(row.message_encrypted as string),
      response: this.encryption.decrypt(row.response_encrypted as string),
      complexityScore: row.complexity_score as number | undefined,
      aiModel: row.ai_model as 'haiku' | 'sonnet',
      createdAt: row.created_at as string
    }));
  }

  /**
   * Child task operations
   */
  async createChildTask(task: Omit<ChildTask, 'id' | 'createdAt'>): Promise<ChildTask> {
    const id = this.encryption.generateSecureId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO child_tasks (id, user_id, title, description, task_type, points, completed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      id, 
      task.userId, 
      task.title, 
      task.description || null, 
      task.taskType, 
      task.points, 
      task.completed, 
      now
    ).run();

    return {
      id,
      userId: task.userId,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      points: task.points,
      completed: task.completed,
      createdAt: now
    };
  }

  async getChildTasks(userId: string, completed?: boolean): Promise<ChildTask[]> {
    let stmt;
    if (completed !== undefined) {
      stmt = this.db.prepare('SELECT * FROM child_tasks WHERE user_id = ? AND completed = ? ORDER BY created_at DESC');
      const result = await stmt.bind(userId, completed).all();
      return result.results as ChildTask[];
    } else {
      stmt = this.db.prepare('SELECT * FROM child_tasks WHERE user_id = ? ORDER BY created_at DESC');
      const result = await stmt.bind(userId).all();
      return result.results as ChildTask[];
    }
  }

  async completeTask(taskId: string): Promise<void> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE child_tasks SET completed = TRUE, completed_at = ? WHERE id = ?');
    await stmt.bind(now, taskId).run();
  }

  /**
   * Child message operations
   */
  async createChildMessage(message: Omit<ChildMessage, 'id' | 'createdAt'>): Promise<ChildMessage> {
    const id = this.encryption.generateSecureId();
    const now = new Date().toISOString();
    const messageEncrypted = this.encryption.encrypt(message.message);
    const responseEncrypted = this.encryption.encrypt(message.aiResponse);

    const stmt = this.db.prepare(`
      INSERT INTO child_messages (id, user_id, message_encrypted, ai_response_encrypted, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    await stmt.bind(id, message.userId, messageEncrypted, responseEncrypted, now).run();

    return {
      id,
      userId: message.userId,
      message: message.message,
      aiResponse: message.aiResponse,
      createdAt: now
    };
  }

  async getChildMessages(userId: string, limit: number = 50): Promise<ChildMessage[]> {
    const stmt = this.db.prepare(`
      SELECT id, user_id, message_encrypted, ai_response_encrypted, created_at
      FROM child_messages 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);

    const result = await stmt.bind(userId, limit).all();
    
    return result.results.map(row => ({
      id: row.id as string,
      userId: row.user_id as string,
      message: this.encryption.decrypt(row.message_encrypted as string),
      aiResponse: this.encryption.decrypt(row.ai_response_encrypted as string),
      createdAt: row.created_at as string
    }));
  }

  /**
   * Financial goal operations
   */
  async createFinancialGoal(goal: Omit<FinancialGoal, 'id' | 'createdAt'>): Promise<FinancialGoal> {
    const id = this.encryption.generateSecureId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO financial_goals (id, user_id, title, description, target_amount, current_amount, goal_type, target_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      id, 
      goal.userId, 
      goal.title, 
      goal.description || null, 
      goal.targetAmount, 
      goal.currentAmount, 
      goal.goalType, 
      goal.targetDate || null, 
      now
    ).run();

    return {
      id,
      userId: goal.userId,
      title: goal.title,
      description: goal.description,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      goalType: goal.goalType,
      targetDate: goal.targetDate,
      createdAt: now
    };
  }

  async getFinancialGoals(userId: string): Promise<FinancialGoal[]> {
    const stmt = this.db.prepare('SELECT * FROM financial_goals WHERE user_id = ? ORDER BY created_at DESC');
    const result = await stmt.bind(userId).all();
    return result.results as FinancialGoal[];
  }

  async updateFinancialGoalProgress(goalId: string, currentAmount: number): Promise<void> {
    const stmt = this.db.prepare('UPDATE financial_goals SET current_amount = ? WHERE id = ?');
    await stmt.bind(currentAmount, goalId).run();
  }

  /**
   * Child insights operations
   */
  async createChildInsight(insight: Omit<ChildInsight, 'id' | 'createdAt'>): Promise<ChildInsight> {
    const id = this.encryption.generateSecureId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO child_insights (id, parent_id, child_id, insight_content, recommendations, insight_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      id, 
      insight.parentId, 
      insight.childId, 
      insight.insightContent, 
      insight.recommendations || null, 
      insight.insightDate, 
      now
    ).run();

    return {
      id,
      parentId: insight.parentId,
      childId: insight.childId,
      insightContent: insight.insightContent,
      recommendations: insight.recommendations,
      insightDate: insight.insightDate,
      createdAt: now
    };
  }

  async getChildInsights(parentId: string, childId: string, limit: number = 10): Promise<ChildInsight[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM child_insights 
      WHERE parent_id = ? AND child_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    
    const result = await stmt.bind(parentId, childId, limit).all();
    return result.results as ChildInsight[];
  }
} 