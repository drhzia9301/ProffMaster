-- AGGRESSIVE VERSION BLOCK - Block profiles table access
-- This will prevent old app users from even completing login
-- Run this in Supabase SQL Editor

-- Step 1: First, ensure the function exists
CREATE OR REPLACE FUNCTION is_version_allowed()
RETURNS BOOLEAN AS $$
DECLARE
    user_version TEXT;
    min_version TEXT;
    user_parts INT[];
    min_parts INT[];
BEGIN
    SELECT app_version INTO user_version 
    FROM profiles 
    WHERE id = auth.uid();
    
    SELECT value INTO min_version 
    FROM app_config 
    WHERE key = 'minimum_version';
    
    IF user_version IS NULL THEN
        user_version := '1.0.0';
    END IF;
    
    IF min_version IS NULL THEN
        RETURN TRUE;
    END IF;
    
    BEGIN
        user_parts := string_to_array(user_version, '.')::int[];
        min_parts := string_to_array(min_version, '.')::int[];
    EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
    END;
    
    RETURN user_parts >= min_parts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- Step 2: Check what tables exist that the app uses
-- Run this to see your tables:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';


-- Step 3: Block device_sessions table (used for login validation)
DROP POLICY IF EXISTS "Block outdated versions from device_sessions" ON device_sessions;

CREATE POLICY "Block outdated versions from device_sessions" ON device_sessions
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (is_version_allowed())
    WITH CHECK (is_version_allowed());


-- Step 4: Block profiles SELECT (this will break ban checks and device session validation)
-- WARNING: This is aggressive - it will break the app completely for old users

-- First, let's see existing policies on profiles:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Add restrictive policy to profiles
DROP POLICY IF EXISTS "Block outdated versions from profiles" ON profiles;

CREATE POLICY "Block outdated versions from profiles" ON profiles
    AS RESTRICTIVE
    FOR SELECT
    TO authenticated
    USING (
        -- Allow reading ONLY if version is allowed OR if reading own profile for first time
        -- This creates a catch-22: can't check version without reading profile
        -- but can't read profile without valid version
        is_version_allowed() OR auth.uid() = id
    );

-- Actually, the above won't work because is_version_allowed() reads profiles itself
-- We need a different approach...

-- Step 5: Let's block the banned_users table check instead
DROP POLICY IF EXISTS "Block outdated versions from banned_users" ON banned_users;

CREATE POLICY "Block outdated versions from banned_users" ON banned_users
    AS RESTRICTIVE
    FOR SELECT
    TO authenticated
    USING (is_version_allowed());
