-- Migration 009: Add service_time to tokens table

ALTER TABLE tokens ADD COLUMN IF NOT EXISTS service_time INTEGER;
