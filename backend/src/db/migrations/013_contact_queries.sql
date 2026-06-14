-- Migration: 013_contact_queries.sql
-- Create table for storing contact us queries

CREATE TABLE IF NOT EXISTS contact_queries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',   -- pending / resolved
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
