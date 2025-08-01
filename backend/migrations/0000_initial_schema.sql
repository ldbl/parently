-- Users table (parents and children)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('parent', 'child')),
    parent_id TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Parent check-ins (emotional + financial)
CREATE TABLE parent_checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    checkin_type TEXT NOT NULL CHECK (checkin_type IN ('morning', 'evening')),
    emotional_state INTEGER NOT NULL CHECK (emotional_state >= 1 AND emotional_state <= 10),
    financial_stress INTEGER NOT NULL CHECK (financial_stress >= 1 AND financial_stress <= 10),
    notes_encrypted TEXT, -- Encrypted notes
    unexpected_expenses DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily plans (cached from AI)
CREATE TABLE daily_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    plan_content TEXT NOT NULL,
    plan_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, plan_date)
);

-- Chat messages
CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    message_encrypted TEXT NOT NULL, -- Encrypted message
    response_encrypted TEXT NOT NULL, -- Encrypted AI response
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 5),
    ai_model TEXT NOT NULL CHECK (ai_model IN ('haiku', 'sonnet')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Child tasks (gamification)
CREATE TABLE child_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL CHECK (task_type IN ('homework', 'social', 'financial')),
    points INTEGER DEFAULT 10,
    completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Child messages (for insights)
CREATE TABLE child_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    message_encrypted TEXT NOT NULL, -- Encrypted message
    ai_response_encrypted TEXT NOT NULL, -- Encrypted AI response
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Family financial goals
CREATE TABLE financial_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('savings', 'activity', 'emergency')),
    target_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Child insights (AI generated summaries)
CREATE TABLE child_insights (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES users(id),
    child_id TEXT NOT NULL REFERENCES users(id),
    insight_content TEXT NOT NULL,
    recommendations TEXT,
    insight_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_parent_checkins_user_date ON parent_checkins(user_id, created_at);
CREATE INDEX idx_chat_messages_user_date ON chat_messages(user_id, created_at);
CREATE INDEX idx_child_tasks_user_completed ON child_tasks(user_id, completed);
CREATE INDEX idx_child_messages_user_date ON child_messages(user_id, created_at);
CREATE INDEX idx_financial_goals_user ON financial_goals(user_id);
CREATE INDEX idx_child_insights_parent_child ON child_insights(parent_id, child_id); 