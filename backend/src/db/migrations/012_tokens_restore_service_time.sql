-- Migration 012: Ensure service_time exists

ALTER TABLE tokens ADD COLUMN IF NOT EXISTS service_time INTEGER;
