-- Version Enforcement Schema
-- This blocks old APK users by tracking app_version in profiles
-- Run this in your Supabase SQL Editor

-- Step 1: Add app_version column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS app_version TEXT DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Create a function to check if a version meets minimum requirements
CREATE OR REPLACE FUNCTION check_version_meets_minimum(user_version TEXT, min_version TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_parts INTEGER[];
    min_parts INTEGER[];
BEGIN
    -- Handle null or empty versions
    IF user_version IS NULL OR user_version = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Parse version strings into arrays of integers
    user_parts := string_to_array(user_version, '.')::INTEGER[];
    min_parts := string_to_array(min_version, '.')::INTEGER[];
    
    -- Compare major version
    IF user_parts[1] > min_parts[1] THEN RETURN TRUE; END IF;
    IF user_parts[1] < min_parts[1] THEN RETURN FALSE; END IF;
    
    -- Compare minor version
    IF COALESCE(user_parts[2], 0) > COALESCE(min_parts[2], 0) THEN RETURN TRUE; END IF;
    IF COALESCE(user_parts[2], 0) < COALESCE(min_parts[2], 0) THEN RETURN FALSE; END IF;
    
    -- Compare patch version
    IF COALESCE(user_parts[3], 0) >= COALESCE(min_parts[3], 0) THEN RETURN TRUE; END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Create a function to get minimum version from app_config
CREATE OR REPLACE FUNCTION get_minimum_version()
RETURNS TEXT AS $$
DECLARE
    min_ver TEXT;
BEGIN
    SELECT value INTO min_ver FROM app_config WHERE key = 'minimum_version';
    RETURN COALESCE(min_ver, '1.0.0');
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 4: Create a function that checks if current user's app version is valid
CREATE OR REPLACE FUNCTION is_user_version_valid()
RETURNS BOOLEAN AS $$
DECLARE
    user_ver TEXT;
    min_ver TEXT;
BEGIN
    -- Get user's app version from profiles
    SELECT app_version INTO user_ver FROM profiles WHERE id = auth.uid();
    
    -- If no profile or version, they need to update
    IF user_ver IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get minimum version
    min_ver := get_minimum_version();
    
    -- Check if user version meets minimum
    RETURN check_version_meets_minimum(user_ver, min_ver);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 5: Create a table to store version block messages for users
-- This will be checked by old apps when they try to authenticate
CREATE TABLE IF NOT EXISTS version_blocks (
    user_id UUID REFERENCES auth.users PRIMARY KEY,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message TEXT DEFAULT 'Please update to the latest version of ProffMaster to continue.',
    minimum_version TEXT
);

ALTER TABLE version_blocks ENABLE ROW LEVEL SECURITY;

-- Users can read their own block status
CREATE POLICY "Users can view own version block"
    ON version_blocks FOR SELECT
    USING (auth.uid() = user_id);

-- Step 6: Create a trigger function to block outdated users
CREATE OR REPLACE FUNCTION block_outdated_users()
RETURNS TRIGGER AS $$
DECLARE
    min_ver TEXT;
BEGIN
    min_ver := get_minimum_version();
    
    -- If user's version is outdated, add them to version_blocks
    IF NOT check_version_meets_minimum(COALESCE(NEW.app_version, '1.0.0'), min_ver) THEN
        INSERT INTO version_blocks (user_id, minimum_version, message)
        VALUES (
            NEW.id, 
            min_ver,
            (SELECT value FROM app_config WHERE key = 'force_update_message')
        )
        ON CONFLICT (user_id) DO UPDATE SET
            minimum_version = EXCLUDED.minimum_version,
            message = EXCLUDED.message,
            blocked_at = NOW();
    ELSE
        -- Remove from blocks if version is now valid
        DELETE FROM version_blocks WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger on profiles
DROP TRIGGER IF EXISTS check_user_version ON profiles;
CREATE TRIGGER check_user_version
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION block_outdated_users();

-- Step 8: Block ALL existing users who haven't updated yet
-- This inserts a block record for every user with old/null version
INSERT INTO version_blocks (user_id, minimum_version, message)
SELECT 
    p.id,
    (SELECT value FROM app_config WHERE key = 'minimum_version'),
    (SELECT value FROM app_config WHERE key = 'force_update_message')
FROM profiles p
WHERE NOT check_version_meets_minimum(COALESCE(p.app_version, '1.0.0'), (SELECT value FROM app_config WHERE key = 'minimum_version'))
ON CONFLICT (user_id) DO UPDATE SET
    minimum_version = EXCLUDED.minimum_version,
    message = EXCLUDED.message,
    blocked_at = NOW();

-- Step 9: Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_version_meets_minimum TO authenticated;
GRANT EXECUTE ON FUNCTION get_minimum_version TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_version_valid TO authenticated;

-- OPTIONAL: Strict enforcement - Block attempts table for outdated users
-- Uncomment these if you want to completely block old users from saving progress
/*
DROP POLICY IF EXISTS "Users can insert own attempts." ON attempts;
CREATE POLICY "Users can insert own attempts."
    ON attempts FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND is_user_version_valid()
    );
*/

-- Verification query - run this to see blocked users
-- SELECT p.id, p.full_name, p.app_version, vb.blocked_at, vb.minimum_version 
-- FROM profiles p 
-- LEFT JOIN version_blocks vb ON p.id = vb.user_id
-- ORDER BY vb.blocked_at DESC NULLS LAST;
