-- Extend solutions table with optional AI metadata

ALTER TABLE solutions
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS detected_subject TEXT,
  ADD COLUMN IF NOT EXISTS subject_confidence NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS extracted_text TEXT;

CREATE INDEX IF NOT EXISTS solutions_detected_subject_idx
  ON solutions (detected_subject);
