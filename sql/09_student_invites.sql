-- Student invite codes (parent/teacher linking)

CREATE TABLE IF NOT EXISTS student_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('parent', 'teacher')),
  code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  redeemed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS student_invites_student_idx
  ON student_invites (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS student_invites_code_idx
  ON student_invites (code);

ALTER TABLE student_invites ENABLE ROW LEVEL SECURITY;

-- Students can see their own invites
DROP POLICY IF EXISTS "Students can view their invites" ON student_invites;
CREATE POLICY "Students can view their invites"
  ON student_invites FOR SELECT
  USING (auth.uid() = student_id);

-- Create invite via RPC (preferred; avoids exposing code generation)
CREATE OR REPLACE FUNCTION create_student_invite(relationship TEXT)
RETURNS TABLE (
  code TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  student_uuid UUID;
  new_code TEXT;
BEGIN
  student_uuid := auth.uid();
  IF student_uuid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF relationship NOT IN ('parent', 'teacher') THEN
    RAISE EXCEPTION 'Invalid relationship';
  END IF;

  -- 12-char hex code (case-insensitive, easy to type)
  new_code := upper(substring(encode(gen_random_bytes(6), 'hex') from 1 for 12));

  INSERT INTO student_invites (student_id, relationship, code)
  VALUES (student_uuid, relationship, new_code)
  RETURNING student_invites.code, student_invites.expires_at INTO code, expires_at;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redeem invite via RPC; inserts link + marks invite as redeemed
CREATE OR REPLACE FUNCTION redeem_student_invite(invite_code TEXT)
RETURNS TABLE (
  student_id UUID,
  relationship TEXT
) AS $$
DECLARE
  guardian_uuid UUID;
  inv RECORD;
BEGIN
  guardian_uuid := auth.uid();
  IF guardian_uuid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO inv
  FROM student_invites
  WHERE code = upper(invite_code)
    AND redeemed_at IS NULL
    AND expires_at > now()
  LIMIT 1;

  IF inv.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  IF inv.student_id = guardian_uuid THEN
    RAISE EXCEPTION 'Cannot link yourself';
  END IF;

  INSERT INTO student_links (student_id, guardian_id, relationship)
  VALUES (inv.student_id, guardian_uuid, inv.relationship)
  ON CONFLICT (student_id, guardian_id, relationship) DO NOTHING;

  UPDATE student_invites
  SET redeemed_by = guardian_uuid,
      redeemed_at = now()
  WHERE id = inv.id;

  student_id := inv.student_id;
  relationship := inv.relationship;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
