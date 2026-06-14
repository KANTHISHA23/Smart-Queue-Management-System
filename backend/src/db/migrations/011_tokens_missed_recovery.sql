-- Migration 011: Add missed status and recovery controls to tokens

ALTER TABLE tokens
  ADD COLUMN IF NOT EXISTS recovery_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE tokens
  ALTER COLUMN status SET DEFAULT 'waiting',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE tokens DROP CONSTRAINT IF EXISTS tokens_status_check;
ALTER TABLE tokens
  ADD CONSTRAINT tokens_status_check CHECK (status IN ('waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled', 'missed'));

CREATE INDEX IF NOT EXISTS idx_tokens_queue ON tokens(queue_id);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_booked_at ON tokens(booked_at);
CREATE INDEX IF NOT EXISTS idx_tokens_queue_status ON tokens(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_priority ON tokens(priority_level);
