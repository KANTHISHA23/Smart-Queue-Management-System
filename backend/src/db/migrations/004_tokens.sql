-- Migration 004: Create tokens table

CREATE TABLE IF NOT EXISTS tokens (
  id SERIAL PRIMARY KEY,
  token_number TEXT NOT NULL,
  queue_id INTEGER NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting',
  is_priority BOOLEAN NOT NULL DEFAULT FALSE,
  priority_reason TEXT,
  position INTEGER NOT NULL,
  booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  serving_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_wait INTEGER,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_tokens_queue ON tokens(queue_id);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_booked_at ON tokens(booked_at);
CREATE INDEX IF NOT EXISTS idx_tokens_queue_status ON tokens(queue_id, status);
