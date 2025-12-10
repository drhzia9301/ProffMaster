-- FORCE VERSION BLOCK VIA RLS
-- This will BLOCK database access for users with outdated app_version
-- Old app users will get errors when trying to use the app
-- Run this in Supabase SQL Editor

-- Step 1: Create a function to check if user's version is allowed
CREATE OR REPLACE FUNCTION is_version_allowed()
RETURNS BOOLEAN AS $$
DECLARE
    user_version TEXT;
    min_version TEXT;
    user_parts INT[];
    min_parts INT[];
BEGIN
    -- Get user's app version from their profile
    SELECT app_version INTO user_version 
    FROM profiles 
    WHERE id = auth.uid();
    
    -- Get minimum required version from app_config
    SELECT value INTO min_version 
    FROM app_config 
    WHERE key = 'minimum_version';
    
    -- Default to 1.0.0 if no version found (old users who never updated)
    IF user_version IS NULL THEN
        user_version := '1.0.0';
    END IF;
    
    -- If no min version set, allow all
    IF min_version IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Parse versions into integer arrays for comparison
    -- Handle versions like "1.2.4" or "1.3.0"
    BEGIN
        user_parts := string_to_array(user_version, '.')::int[];
        min_parts := string_to_array(min_version, '.')::int[];
    EXCEPTION WHEN OTHERS THEN
        -- If parsing fails, block the user (safer)
        RETURN FALSE;
    END;
    
    -- Compare major.minor.patch
    -- Returns true if user_version >= min_version
    RETURN user_parts >= min_parts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 2: Block the attempts table - this will break the old app
-- Old users won't be able to save or load their quiz progress

-- First, drop any existing version check policy
DROP POLICY IF EXISTS "Block outdated versions from attempts" ON attempts;

-- Create new policy that blocks outdated versions
CREATE POLICY "Block outdated versions from attempts" ON attempts
    AS RESTRICTIVE  -- This means it MUST pass in addition to other policies
    FOR ALL
    TO authenticated
    USING (is_version_allowed())
    WITH CHECK (is_version_allowed());

-- Step 3: Test the function (optional - run manually to test)
-- Replace with an actual user ID to test:
-- SELECT is_version_allowed();

-- Step 4: View users who will be blocked
-- SELECT id, email, app_version FROM profiles WHERE app_version < '1.3.0' OR app_version IS NULL;
