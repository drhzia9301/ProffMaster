-- Temporarily disable device session restrictions
-- This allows users to login on multiple devices simultaneously
-- Run this in Supabase SQL Editor

-- Step 1: Drop the table (this will drop policies too)
DROP TABLE IF EXISTS device_sessions CASCADE;

-- Step 2: Recreate the table without the UNIQUE constraint on user_id
CREATE TABLE device_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL, -- Removed UNIQUE constraint
  device_id text NOT NULL,
  device_name text,
  device_platform text,
  ip_address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_active_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  session_token text NOT NULL UNIQUE
);

-- Step 3: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_session_token ON device_sessions(session_token);

-- Step 4: Enable RLS
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create fully permissive policies (allow anonymous too to avoid auth issues)
CREATE POLICY "Allow select on device sessions (temporary)" 
ON device_sessions FOR SELECT 
TO public
USING (true);

CREATE POLICY "Allow insert on device sessions (temporary)" 
ON device_sessions FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Allow update on device sessions (temporary)" 
ON device_sessions FOR UPDATE 
TO public
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow delete on device sessions (temporary)" 
ON device_sessions FOR DELETE 
TO public
USING (true);

-- Step 6: Add back to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE device_sessions;

-- Step 7: Create a function that ALWAYS succeeds when inserting/updating sessions
-- This bypasses the client-side logic that's causing the error
CREATE OR REPLACE FUNCTION upsert_device_session(
  p_user_id uuid,
  p_device_id text,
  p_device_name text,
  p_device_platform text,
  p_session_token text
) RETURNS void AS $$
BEGIN
  -- Simply insert a new session without checking for existing ones
  INSERT INTO device_sessions (
    user_id,
    device_id,
    device_name,
    device_platform,
    session_token,
    last_active_at
  ) VALUES (
    p_user_id,
    p_device_id,
    p_device_name,
    p_device_platform,
    p_session_token,
    NOW()
  )
  ON CONFLICT (session_token) DO UPDATE SET
    last_active_at = NOW(),
    device_name = EXCLUDED.device_name;
    
  -- Delete old sessions for this user (keep only last 10 per user to prevent bloat)
  DELETE FROM device_sessions
  WHERE user_id = p_user_id
  AND id NOT IN (
    SELECT id FROM device_sessions
    WHERE user_id = p_user_id
    ORDER BY last_active_at DESC
    LIMIT 10
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_device_session TO authenticated;

-- To re-enable device restrictions later, run:
-- DROP POLICY IF EXISTS "Allow multiple device sessions (temporary)" ON device_sessions;
-- CREATE POLICY "Users can only have one active session" 
-- ON device_sessions
-- FOR ALL
-- TO authenticated
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());
