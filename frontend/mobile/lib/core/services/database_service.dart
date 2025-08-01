import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:parently/core/models/checkin.dart';
import 'package:parently/core/models/daily_plan.dart';

class DatabaseService {
  static Database? _database;
  static const String _databaseName = 'parently.db';
  static const int _databaseVersion = 1;

  // Table names
  static const String _checkinsTable = 'checkins';
  static const String _dailyPlansTable = 'daily_plans';

  static Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  static Future<Database> _initDatabase() async {
    final databasePath = await getDatabasesPath();
    final path = join(databasePath, _databaseName);

    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  static Future<void> _onCreate(Database db, int version) async {
    // Create check-ins table
    await db.execute('''
      CREATE TABLE $_checkinsTable (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        checkinType TEXT NOT NULL,
        emotionalState INTEGER NOT NULL,
        financialStress INTEGER NOT NULL,
        notes TEXT,
        unexpectedExpenses REAL NOT NULL,
        createdAt TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    ''');

    // Create daily plans table
    await db.execute('''
      CREATE TABLE $_dailyPlansTable (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        planContent TEXT NOT NULL,
        planDate TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    ''');

    // Create indexes
    await db.execute('CREATE INDEX idx_checkins_user_date ON $_checkinsTable(userId, createdAt)');
    await db.execute('CREATE INDEX idx_checkins_synced ON $_checkinsTable(synced)');
    await db.execute('CREATE INDEX idx_plans_user_date ON $_dailyPlansTable(userId, planDate)');
    await db.execute('CREATE INDEX idx_plans_synced ON $_dailyPlansTable(synced)');
  }

  static Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Handle database upgrades here
    if (oldVersion < 2) {
      // Add new columns or tables for version 2
    }
  }

  // Check-in operations
  static Future<void> insertCheckin(Checkin checkin) async {
    final db = await database;
    await db.insert(
      _checkinsTable,
      {
        'id': checkin.id,
        'userId': checkin.userId,
        'checkinType': checkin.checkinType,
        'emotionalState': checkin.emotionalState,
        'financialStress': checkin.financialStress,
        'notes': checkin.notes,
        'unexpectedExpenses': checkin.unexpectedExpenses,
        'createdAt': checkin.createdAt,
        'synced': 1, // Mark as synced since it came from API
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  static Future<List<Checkin>> getRecentCheckins(String userId, {int limit = 10}) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      _checkinsTable,
      where: 'userId = ?',
      whereArgs: [userId],
      orderBy: 'createdAt DESC',
      limit: limit,
    );

    return List.generate(maps.length, (i) {
      return Checkin(
        id: maps[i]['id'],
        userId: maps[i]['userId'],
        checkinType: maps[i]['checkinType'],
        emotionalState: maps[i]['emotionalState'],
        financialStress: maps[i]['financialStress'],
        notes: maps[i]['notes'],
        unexpectedExpenses: maps[i]['unexpectedExpenses'],
        createdAt: maps[i]['createdAt'],
      );
    });
  }

  static Future<List<Checkin>> getUnsyncedCheckins() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      _checkinsTable,
      where: 'synced = ?',
      whereArgs: [0],
    );

    return List.generate(maps.length, (i) {
      return Checkin(
        id: maps[i]['id'],
        userId: maps[i]['userId'],
        checkinType: maps[i]['checkinType'],
        emotionalState: maps[i]['emotionalState'],
        financialStress: maps[i]['financialStress'],
        notes: maps[i]['notes'],
        unexpectedExpenses: maps[i]['unexpectedExpenses'],
        createdAt: maps[i]['createdAt'],
      );
    });
  }

  static Future<void> markCheckinSynced(String id) async {
    final db = await database;
    await db.update(
      _checkinsTable,
      {'synced': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Daily plan operations
  static Future<void> insertDailyPlan(DailyPlan plan) async {
    final db = await database;
    await db.insert(
      _dailyPlansTable,
      {
        'id': plan.id,
        'userId': plan.userId,
        'planContent': plan.planContent,
        'planDate': plan.planDate,
        'createdAt': plan.createdAt,
        'synced': 1, // Mark as synced since it came from API
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  static Future<DailyPlan?> getDailyPlan(String userId, String date) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      _dailyPlansTable,
      where: 'userId = ? AND planDate = ?',
      whereArgs: [userId, date],
      limit: 1,
    );

    if (maps.isEmpty) return null;

    return DailyPlan(
      id: maps[0]['id'],
      userId: maps[0]['userId'],
      planContent: maps[0]['planContent'],
      planDate: maps[0]['planDate'],
      createdAt: maps[0]['createdAt'],
    );
  }

  static Future<List<DailyPlan>> getRecentPlans(String userId, {int limit = 3}) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      _dailyPlansTable,
      where: 'userId = ?',
      whereArgs: [userId],
      orderBy: 'planDate DESC',
      limit: limit,
    );

    return List.generate(maps.length, (i) {
      return DailyPlan(
        id: maps[i]['id'],
        userId: maps[i]['userId'],
        planContent: maps[i]['planContent'],
        planDate: maps[i]['planDate'],
        createdAt: maps[i]['createdAt'],
      );
    });
  }

  // Offline check-in creation
  static Future<void> createOfflineCheckin({
    required String userId,
    required String checkinType,
    required int emotionalState,
    required int financialStress,
    String? notes,
    double unexpectedExpenses = 0,
  }) async {
    final db = await database;
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    final createdAt = DateTime.now().toIso8601String();

    await db.insert(
      _checkinsTable,
      {
        'id': id,
        'userId': userId,
        'checkinType': checkinType,
        'emotionalState': emotionalState,
        'financialStress': financialStress,
        'notes': notes,
        'unexpectedExpenses': unexpectedExpenses,
        'createdAt': createdAt,
        'synced': 0, // Mark as not synced
      },
    );
  }

  // Offline plan creation
  static Future<void> createOfflinePlan({
    required String userId,
    required String planContent,
    required String planDate,
  }) async {
    final db = await database;
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    final createdAt = DateTime.now().toIso8601String();

    await db.insert(
      _dailyPlansTable,
      {
        'id': id,
        'userId': userId,
        'planContent': planContent,
        'planDate': planDate,
        'createdAt': createdAt,
        'synced': 0, // Mark as not synced
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Sync operations
  static Future<void> syncOfflineData() async {
    // This would be called when the app comes back online
    // Implementation would sync unsynced data with the API
    print('Syncing offline data...');
  }

  // Clear data
  static Future<void> clearUserData(String userId) async {
    final db = await database;
    await db.delete(
      _checkinsTable,
      where: 'userId = ?',
      whereArgs: [userId],
    );
    await db.delete(
      _dailyPlansTable,
      where: 'userId = ?',
      whereArgs: [userId],
    );
  }

  // Close database
  static Future<void> close() async {
    final db = await database;
    await db.close();
  }
} 