-- App Configuration Table for version control and other settings
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read app config (needed for version checks before auth)
CREATE POLICY "App config is readable by everyone"
    ON app_config FOR SELECT
    USING (true);

-- Only admins can update config
CREATE POLICY "Only admins can update app config"
    ON app_config FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Insert initial minimum version
INSERT INTO app_config (key, value, description)
VALUES 
    ('minimum_version', '1.3.0', 'Minimum app version required. Users with older versions will be forced to update.'),
    ('force_update_message', 'A new version of ProffMaster is available with important improvements. Please update to continue.', 'Message shown to users when force update is required.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
