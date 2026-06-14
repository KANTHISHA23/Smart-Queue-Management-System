"""
Export completed-token history from PostgreSQL for wait-time model training.
"""
import os
from pathlib import Path

import pandas as pd
import psycopg2
from dotenv import load_dotenv

ML_DIR = Path(__file__).resolve().parent
ROOT_DIR = ML_DIR.parent
DATA_DIR = ML_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

load_dotenv(ROOT_DIR / "backend" / ".env")
load_dotenv(ROOT_DIR / ".env")

EXPORT_QUERY = """
SELECT
  t.id AS token_id,
  t.queue_id,
  t.position,
  t.priority_level,
  EXTRACT(EPOCH FROM (t.called_at - t.booked_at)) / 60.0 AS actual_wait_minutes,
  (
    SELECT COUNT(*) FROM tokens t2
    WHERE t2.queue_id = t.queue_id
      AND t2.status = 'waiting'
      AND t2.booked_at <= t.booked_at
      AND t2.id <> t.id
  ) AS queue_length,
  GREATEST(t.position - 1, 0) AS people_ahead,
  COALESCE(
    (
      SELECT AVG(sub.service_time)
      FROM (
        SELECT service_time FROM tokens
        WHERE queue_id = t.queue_id
          AND status = 'completed'
          AND service_time IS NOT NULL
          AND service_time > 0
          AND completed_at < t.booked_at
        ORDER BY completed_at DESC
        LIMIT 20
      ) sub
    ),
    q.avg_service_time,
    5
  ) AS avg_service_time_last_20,
  q.avg_service_time AS queue_avg_service_time,
  q.max_capacity,
  EXTRACT(HOUR FROM t.booked_at)::int AS hour_of_day,
  EXTRACT(DOW FROM t.booked_at)::int AS day_of_week,
  l.type AS location_type
FROM tokens t
JOIN queues q ON q.id = t.queue_id
JOIN locations l ON l.id = q.location_id
WHERE t.status = 'completed'
  AND t.called_at IS NOT NULL
  AND t.booked_at IS NOT NULL
  AND EXTRACT(EPOCH FROM (t.called_at - t.booked_at)) / 60.0 >= 0
ORDER BY t.booked_at ASC
"""


def main():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL is not set. Configure backend/.env first.")

    conn = psycopg2.connect(database_url)
    try:
        df = pd.read_sql(EXPORT_QUERY, conn)
    finally:
        conn.close()

    if df.empty:
        print("No completed tokens found. Run: cd backend && npm run seed")
        return

    out_path = DATA_DIR / "training_data.csv"
    df.to_csv(out_path, index=False)
    print(f"Exported {len(df)} rows to {out_path}")


if __name__ == "__main__":
    main()
