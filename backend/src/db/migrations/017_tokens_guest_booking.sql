-- Migration 017: Guest token booking (walk-in without user account)

ALTER TABLE tokens
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT;

ALTER TABLE tokens
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE tokens DROP CONSTRAINT IF EXISTS tokens_user_or_guest_check;
ALTER TABLE tokens
  ADD CONSTRAINT tokens_user_or_guest_check CHECK (
    user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_phone IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_tokens_guest_phone ON tokens(guest_phone)
  WHERE guest_phone IS NOT NULL;
