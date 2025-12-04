-- =====================================================
-- Subscription & Admin Management
-- This manages paid access to Preproff papers and admin functionality
-- =====================================================

-- Add subscription columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_preproff_access boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preproff_access_granted_at timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preproff_access_granted_by uuid REFERENCES auth.users;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create a table to track subscription/access grants (audit log)
CREATE TABLE IF NOT EXISTS access_grants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  access_type text NOT NULL, -- 'preproff', 'ai_questions', etc.
  granted_by uuid REFERENCES auth.users NOT NULL,
  granted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes text, -- Admin can add payment reference, etc.
  revoked_at timestamp with time zone,
  revoked_by uuid REFERENCES auth.users
);

-- Create index for access grants
CREATE INDEX IF NOT EXISTS idx_access_grants_user_id ON access_grants(user_id);

-- Enable RLS for access_grants
ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view all access grants
CREATE POLICY "Admins can view all access grants"
  ON access_grants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy: Users can view their own access grants
CREATE POLICY "Users can view own access grants"
  ON access_grants FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Only admins can insert access grants
CREATE POLICY "Admins can insert access grants"
  ON access_grants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy: Only admins can update access grants (for revoking)
CREATE POLICY "Admins can update access grants"
  ON access_grants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Update profiles policy to allow admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Function to grant preproff access
CREATE OR REPLACE FUNCTION grant_preproff_access(target_user_id uuid, admin_notes text DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get the current admin's ID
  admin_id := auth.uid();
  
  -- Check if caller is an admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Only admins can grant access';
  END IF;
  
  -- Update the user's profile
  UPDATE profiles 
  SET 
    has_preproff_access = true,
    preproff_access_granted_at = now(),
    preproff_access_granted_by = admin_id
  WHERE id = target_user_id;
  
  -- Log the grant
  INSERT INTO access_grants (user_id, access_type, granted_by, notes)
  VALUES (target_user_id, 'preproff', admin_id, admin_notes);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke preproff access
CREATE OR REPLACE FUNCTION revoke_preproff_access(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  admin_id uuid;
BEGIN
  admin_id := auth.uid();
  
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Only admins can revoke access';
  END IF;
  
  -- Update the user's profile
  UPDATE profiles 
  SET 
    has_preproff_access = false,
    preproff_access_granted_at = NULL,
    preproff_access_granted_by = NULL
  WHERE id = target_user_id;
  
  -- Mark the grant as revoked
  UPDATE access_grants 
  SET 
    revoked_at = now(),
    revoked_by = admin_id
  WHERE user_id = target_user_id 
    AND access_type = 'preproff' 
    AND revoked_at IS NULL;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- IMPORTANT: Run this manually to set yourself as admin
-- Replace 'your-email@example.com' with your actual email
-- =====================================================
-- UPDATE profiles SET is_admin = true WHERE email = 'your-email@example.com';
