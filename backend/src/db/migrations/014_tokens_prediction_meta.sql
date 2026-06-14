ALTER TABLE tokens
  ADD COLUMN IF NOT EXISTS prediction_source TEXT DEFAULT 'heuristic';
