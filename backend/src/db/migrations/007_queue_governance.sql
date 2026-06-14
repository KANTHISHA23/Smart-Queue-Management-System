-- Migration 007: Queue governance status model

UPDATE queues
SET status = CASE
  WHEN status = 'paused' THEN 'inactive'
  WHEN status = 'closed' THEN 'inactive'
  WHEN status IS NULL THEN 'pending'
  ELSE status
END;

ALTER TABLE queues
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE queues DROP CONSTRAINT IF EXISTS queues_status_check;
ALTER TABLE queues
  ADD CONSTRAINT queues_status_check CHECK (status IN ('pending', 'active', 'inactive'));

CREATE INDEX IF NOT EXISTS idx_queues_location ON queues(location_id);
CREATE INDEX IF NOT EXISTS idx_queues_status ON queues(status);
CREATE INDEX IF NOT EXISTS idx_queues_org ON queues(organization_id);
