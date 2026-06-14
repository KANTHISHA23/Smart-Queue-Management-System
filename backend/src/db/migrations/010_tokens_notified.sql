-- Migration 010: Add notified flag to tokens table

ALTER TABLE tokens
  ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT FALSE;
