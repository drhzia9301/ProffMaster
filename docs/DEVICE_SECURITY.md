# Device Security & Single-Device Login

This document explains the single-device login security feature implemented to prevent account sharing.

## Overview

ProffMaster enforces a **single-device login policy** to prevent users from sharing their subscription with others. Only ONE device can be logged in per account at any time.

## How It Works

### 1. Device Fingerprinting
- On mobile (Android/iOS): Uses the device's unique hardware identifier via Capacitor
- On web: Creates a fingerprint based on browser characteristics (user agent, screen size, timezone, etc.)

### 2. Session Registration
- When a user logs in, a new device session is created in the `device_sessions` table
- Each session has a unique token stored both server-side and locally
- Only ONE session per user is allowed (enforced by `UNIQUE` constraint on `user_id`)

### 3. Conflict Detection
- If a user tries to log in on Device B while already logged in on Device A:
  - A warning modal appears showing which device is currently active
  - User is warned that continuing will log out the other device
  - A violation is recorded for ban tracking

### 4. Real-time Logout
- When a new login occurs, the old device is notified via Supabase Realtime
- The old device shows a "You've been logged out" modal
- User must re-login to continue

### 5. Ban System
- Each device conflict logs a violation
- After **5 violations**, the account is automatically banned
- Banned users see a modal explaining the ban and how to appeal

## Database Schema

Run the SQL in `supabase/schema_device_sessions.sql` to set up:

```sql
-- Tables created:
- device_sessions: Tracks active session per user
- session_violations: Logs each violation for ban tracking

-- Columns added to profiles:
- violation_count: Number of violations
- is_banned: Whether user is banned
- banned_at: When the ban occurred
- ban_reason: Reason for the ban
```

## Files Modified/Created

### New Files
- `services/deviceSessionService.ts` - Core service for device session management
- `components/DeviceConflictModal.tsx` - Warning modal for device conflicts
- `components/BannedUserModal.tsx` - Modal shown to banned users
- `components/SessionInvalidatedModal.tsx` - Modal shown when logged out by another device
- `supabase/schema_device_sessions.sql` - Database migration

### Modified Files
- `contexts/AuthContext.tsx` - Added device session validation and state
- `components/Login.tsx` - Added device registration and conflict handling
- `App.tsx` - Added modals for banned users and session invalidation
- `package.json` - Added `@capacitor/device` dependency

## Security Considerations

1. **Device ID Persistence**: Device IDs are stored in localStorage to survive app restarts
2. **Session Tokens**: Unique tokens prevent session hijacking
3. **Real-time Detection**: Immediate notification when logged out elsewhere
4. **Progressive Warnings**: Users get 5 chances before permanent ban
5. **Appeal Process**: Banned users can contact support

## Testing

1. Log in on Device A
2. Log in on Device B with the same account
3. Device B should show the conflict modal with warning
4. Click "Continue Anyway" on Device B
5. Device A should show "You've been logged out" modal
6. Repeat 5 times to trigger auto-ban

## Configuration

The ban threshold is set to 5 violations. To change this, modify the SQL function `increment_violation_count()` in the schema file.
