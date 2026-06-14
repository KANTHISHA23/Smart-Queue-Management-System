-- Migration 016: Local reviews stored on locations (JSON array)

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS reviews JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_locations_reviews ON locations USING GIN (reviews);
