-- Migration 003: Create queues table

CREATE TABLE IF NOT EXISTS queues (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prefix TEXT DEFAULT 'A',
  current_number INTEGER NOT NULL DEFAULT 0,
  now_serving INTEGER NOT NULL DEFAULT 0,
  max_capacity INTEGER NOT NULL DEFAULT 100,
  avg_service_time INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queues_location ON queues(location_id);
CREATE INDEX IF NOT EXISTS idx_queues_status ON queues(status);
