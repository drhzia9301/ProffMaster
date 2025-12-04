-- =====================================================
-- Device Session Management for Single-Device Login
-- This prevents account sharing by allowing only ONE
-- active session per user at a time.
-- =====================================================

-- Create a table to track active device sessions
CREATE TABLE IF NOT EXISTS device_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE, -- UNIQUE ensures only 1 session per user
  device_id text NOT NULL,
  device_name text,
  device_platform text, -- 'android', 'ios', 'web'
  ip_address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_active_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  session_token text NOT NULL UNIQUE -- Used to validate the session
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_session_token ON device_sessions(session_token);

-- Enable RLS
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own device session
CREATE POLICY "Users can view own device session"
  ON device_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own device session
CREATE POLICY "Users can insert own device session"
  ON device_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own device session
CREATE POLICY "Users can update own device session"
  ON device_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own device session (for logout)
CREATE POLICY "Users can delete own device session"
  ON device_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create a table to track session violations (for potential banning)
CREATE TABLE IF NOT EXISTS session_violations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  violation_type text NOT NULL, -- 'multiple_device_attempt', 'forced_logout', etc.
  device_id text,
  device_name text,
  ip_address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for violation lookups
CREATE INDEX IF NOT EXISTS idx_session_violations_user_id ON session_violations(user_id);

-- Enable RLS for violations
ALTER TABLE session_violations ENABLE ROW LEVEL SECURITY;

-- Policy: Users cannot view violations (admin only via service role)
-- No SELECT policy = users cannot see their violation history

-- Policy: Allow insert for logging violations (service role or authenticated user logging themselves)
CREATE POLICY "Users can insert own violations"
  ON session_violations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add violation_count to profiles table for ban tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS violation_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason text;

-- Function to increment violation count and auto-ban after threshold
CREATE OR REPLACE FUNCTION increment_violation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET violation_count = violation_count + 1,
      is_banned = CASE WHEN violation_count + 1 >= 5 THEN true ELSE is_banned END,
      banned_at = CASE WHEN violation_count + 1 >= 5 THEN now() ELSE banned_at END,
      ban_reason = CASE WHEN violation_count + 1 >= 5 THEN 'Auto-banned: Too many device sharing violations' ELSE ban_reason END
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment violation count
CREATE OR REPLACE TRIGGER on_session_violation
  AFTER INSERT ON session_violations
  FOR EACH ROW EXECUTE FUNCTION increment_violation_count();

-- Add realtime for device_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE device_sessions;
