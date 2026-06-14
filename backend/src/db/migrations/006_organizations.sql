-- Migration 006: Multi-tenant organizations

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO organizations (name, email, password_hash, type)
VALUES ('Default Organization', 'default@smartqueue.local', '__NO_LOGIN__', 'default')
ON CONFLICT (email) DO NOTHING;

ALTER TABLE queues
  ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE RESTRICT;

UPDATE queues
SET organization_id = (SELECT id FROM organizations WHERE email = 'default@smartqueue.local')
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_queues_org ON queues(organization_id);
