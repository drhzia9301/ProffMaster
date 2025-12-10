-- Unban admin account haroonzia620@gmail.com
-- Run this in Supabase SQL Editor

UPDATE profiles
SET 
    is_banned = false,
    ban_reason = NULL,
    violation_count = 0
WHERE email = 'haroonzia620@gmail.com';

-- Verify the update
SELECT id, email, is_banned, ban_reason, violation_count, is_admin
FROM profiles
WHERE email = 'haroonzia620@gmail.com';
