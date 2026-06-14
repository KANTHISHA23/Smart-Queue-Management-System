-- Migration 015: Profile avatar URLs for organizations

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
