# Subscription & Admin System

This document explains the paid subscription system for Preproff papers and the admin panel.

## Overview

Preproff papers are premium content that requires a one-time payment of **Rs 300**. Users must pay to unlock access, and admins can grant/revoke access through the admin dashboard.

## How It Works

### For Users

1. **Locked Content**: When a user tries to access Preproff papers without a subscription, they see a locked modal explaining:
   - What's included (all block papers from KMC & KGMC)
   - Price (Rs 300 one-time)
   - Payment instructions (via WhatsApp → JazzCash/EasyPaisa)

2. **Payment Process**:
   - User clicks "Contact on WhatsApp"
   - Sends payment via JazzCash/EasyPaisa
   - Shares screenshot with admin
   - Admin grants access from dashboard

3. **Access Granted**: Once granted, users get full access to all Preproff papers permanently.

### For Admins

1. **Access Admin Dashboard**: Go to Settings → Admin Dashboard (only visible to admin accounts)

2. **Search Users**: 
   - Enter user's email address
   - Click Search
   - View user details (subscription status, violations, ban status)

3. **Grant Access**:
   - Find the user
   - Click "Grant Access" button
   - Access is immediately activated

4. **Revoke Access**:
   - Find the user in the Subscribers tab or via search
   - Click "Revoke" button
   - Confirm the action

5. **View Statistics**:
   - Total registered users
   - Number of active subscribers
   - Banned users count

## Database Schema

Run `supabase/schema_subscriptions.sql` to set up:

```sql
-- Columns added to profiles:
- has_preproff_access (boolean) - Whether user has paid access
- preproff_access_granted_at (timestamp) - When access was granted
- preproff_access_granted_by (uuid) - Which admin granted it
- is_admin (boolean) - Whether user is an admin

-- New table: access_grants
- Logs all access grants/revocations for audit trail
```

## Setting Up Your Admin Account

After running the SQL schema, make yourself an admin by running this in Supabase SQL Editor:

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with your actual email.

## Configuration

Update these values in `constants.ts`:

```typescript
export const APP_CONFIG = {
  // Your WhatsApp number (country code + number, no +)
  WHATSAPP_NUMBER: '923001234567',
  
  // Support email
  SUPPORT_EMAIL: 'support@proffmaster.com',
  
  // Subscription price in PKR
  PREPROFF_PRICE: 300,
};
```

## Files Created/Modified

### New Files
- `supabase/schema_subscriptions.sql` - Database schema for subscriptions
- `services/subscriptionService.ts` - Service for checking/granting access
- `components/LockedContentModal.tsx` - Modal shown when content is locked
- `components/AdminDashboard.tsx` - Admin panel for managing users

### Modified Files
- `components/PreproffBlocksPage.tsx` - Added access check before showing content
- `components/Settings.tsx` - Added admin dashboard link (visible only to admins)
- `App.tsx` - Added admin route
- `constants.ts` - Added app configuration (WhatsApp number, prices)

## Payment Flow

```
User clicks Preproff → Locked Modal appears
         ↓
User clicks "Contact on WhatsApp"
         ↓
User sends Rs 300 via JazzCash/EasyPaisa
         ↓
User sends payment screenshot
         ↓
Admin opens Admin Dashboard
         ↓
Admin searches user by email
         ↓
Admin clicks "Grant Access"
         ↓
User refreshes app → Content unlocked!
```

## Security Notes

1. **RLS Policies**: Only admins can grant/revoke access
2. **Audit Trail**: All access changes are logged in `access_grants` table
3. **Admin Check**: Admin dashboard verifies `is_admin` status before showing
4. **Client-side Check**: UI checks access status before allowing navigation
