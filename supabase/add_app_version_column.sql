-- Add app_version column to profiles table to track user's app version
-- This allows us to enforce minimum version requirements
-- Run this in Supabase SQL Editor

-- Add app_version column (default to 1.0.0 for existing users)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS app_version TEXT DEFAULT '1.0.0';

-- Add last_version_check timestamp
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_version_check TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index for version queries (useful for admin queries)
CREATE INDEX IF NOT EXISTS idx_profiles_app_version ON profiles(app_version);

-- NOTE: The existing profiles update policy should already allow users to update their own profile.
-- If you get permission errors, you may need to check your RLS policies.

-- View to see all users and their versions (for admin)
CREATE OR REPLACE VIEW user_versions AS
SELECT 
    id,
    email,
    full_name,
    app_version,
    last_version_check,
    created_at
FROM profiles
ORDER BY last_version_check DESC;

-- Grant access to the view
GRANT SELECT ON user_versions TO authenticated;
