-- Migration 008: Replace is_priority with priority_level

ALTER TABLE tokens
  ADD COLUMN IF NOT EXISTS priority_level TEXT;

UPDATE tokens
SET priority_level = CASE
  WHEN priority_level IS NOT NULL THEN priority_level
  WHEN COALESCE(is_priority, FALSE) THEN 'priority'
  ELSE 'normal'
END;

ALTER TABLE tokens
  ALTER COLUMN priority_level SET DEFAULT 'normal',
  ALTER COLUMN priority_level SET NOT NULL;

ALTER TABLE tokens DROP CONSTRAINT IF EXISTS tokens_priority_level_check;
ALTER TABLE tokens
  ADD CONSTRAINT tokens_priority_level_check CHECK (priority_level IN ('normal', 'priority', 'emergency'));

ALTER TABLE tokens DROP COLUMN IF EXISTS is_priority;

CREATE INDEX IF NOT EXISTS idx_tokens_priority ON tokens(priority_level);
