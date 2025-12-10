# Bob University Database Schema Summary

## Overview

Complete database schema for Bob University MVP, supporting:
- User profiles with role-based access (individual, salon_owner, staff, admin)
- Salon management for multi-user accounts
- Freemium subscription model with dual payment rails (Apple IAP + Stripe)
- Video-based learning content with progress tracking
- Push notifications

## Schema Architecture

### Authentication & User Management

#### profiles
**Purpose**: Extends Supabase auth.users with application-specific user data

**Columns**:
- `id` (UUID, PK) - References auth.users.id
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `role` (TEXT) - 'individual' | 'salon_owner' | 'staff' | 'admin'
- `salon_id` (UUID, FK) - References salons.id
- `years_experience` (INTEGER)
- `location` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies**:
- Users can SELECT/UPDATE/INSERT own profile

**Triggers**:
- `on_auth_user_created` - Auto-creates profile when user signs up

**Indexes**:
- `idx_profiles_salon_id` on salon_id
- `idx_profiles_role` on role

#### salons
**Purpose**: Salon organizations for multi-user accounts

**Columns**:
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `owner_id` (UUID, FK) - References profiles.id
- `max_staff` (INTEGER, DEFAULT 5)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies**:
- Salon owners can SELECT/UPDATE own salon
- Users can INSERT salons (as owner)

**Relationships**:
- One salon has one owner (owner_id -> profiles.id)
- Many staff can belong to one salon (profiles.salon_id -> salons.id)

### Payments & Subscriptions

#### entitlements
**Purpose**: Unified access control for freemium model (dual-rail payments)

**Columns**:
- `id` (UUID, PK)
- `user_id` (UUID, FK, UNIQUE) - References profiles.id
- `plan` (TEXT) - 'free' | 'individual' | 'salon'
- `status` (TEXT) - 'active' | 'canceled' | 'past_due' | 'expired'
- `current_period_start` (TIMESTAMPTZ)
- `current_period_end` (TIMESTAMPTZ)
- `cancel_at_period_end` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies**:
- Users can SELECT own entitlement

**Triggers**:
- `on_profile_created` - Auto-creates 'free' entitlement on profile creation

**Indexes**:
- `idx_entitlements_user_id` on user_id
- `idx_entitlements_status` on status

**Design Notes**:
- Single source of truth for access control
- Updated by webhooks from both Apple and Stripe
- App checks this table to determine what user can access

#### purchases
**Purpose**: Purchase history for all payment types

**Columns**:
- `id` (UUID, PK)
- `user_id` (UUID, FK) - References profiles.id
- `source` (TEXT) - 'apple' | 'stripe'
- `product_type` (TEXT) - 'subscription' | 'certification' | 'event' | 'merch'
- `product_id` (TEXT) - SKU or price_id
- `external_id` (TEXT) - Transaction ID from payment provider
- `status` (TEXT) - 'pending' | 'completed' | 'failed' | 'refunded'
- `amount_cents` (INTEGER)
- `currency` (TEXT, DEFAULT 'USD')
- `metadata` (JSONB) - Additional purchase data
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies**:
- Users can SELECT own purchases

**Indexes**:
- `idx_purchases_user_id` on user_id
- `idx_purchases_source` on source
- `idx_purchases_external_id` on external_id

**Design Notes**:
- Records all purchases regardless of source
- External_id used for idempotency and refund lookups
- Metadata stores source-specific details

### Content Management

#### modules
**Purpose**: Course organization/categories

**Columns**:
- `id` (UUID, PK)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `thumbnail_url` (TEXT)
- `sort_order` (INTEGER, DEFAULT 0)
- `is_published` (BOOLEAN, DEFAULT FALSE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies**:
- Anyone can SELECT published modules
- Admins can manage all modules

**Indexes**:
- `idx_modules_published` on is_published
- `idx_modules_sort_order` on sort_order

#### videos
**Purpose**: Video content and metadata

**Columns**:
- `id` (UUID, PK)
- `module_id` (UUID, FK) - References modules.id
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `video_url` (TEXT, NOT NULL)
- `thumbnail_url` (TEXT)
- `duration_seconds` (INTEGER)
- `sort_order` (INTEGER, DEFAULT 0)
- `is_free` (BOOLEAN, DEFAULT FALSE) - Free preview content
- `is_published` (BOOLEAN, DEFAULT FALSE)
- `transcript` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies**:
- Anyone can SELECT published video metadata
- Admins can manage all videos

**Indexes**:
- `idx_videos_module_id` on module_id
- `idx_videos_published` on is_published
- `idx_videos_sort_order` on sort_order

**Design Notes**:
- video_url can be Supabase Storage URL or external CDN
- is_free allows preview content for non-subscribers
- Access control happens in app (check entitlement + is_free)

#### video_progress
**Purpose**: Track user video watching progress

**Columns**:
- `id` (UUID, PK)
- `user_id` (UUID, FK) - References profiles.id
- `video_id` (UUID, FK) - References videos.id
- `watched_seconds` (INTEGER, DEFAULT 0)
- `duration_seconds` (INTEGER) - Duration at time of watching
- `completed` (BOOLEAN, DEFAULT FALSE)
- `completed_at` (TIMESTAMPTZ)
- `last_watched_at` (TIMESTAMPTZ, DEFAULT NOW())
- `created_at` (TIMESTAMPTZ)
- UNIQUE constraint on (user_id, video_id)

**RLS Policies**:
- Users can SELECT/UPDATE/INSERT own progress

**Indexes**:
- `idx_video_progress_user_id` on user_id
- `idx_video_progress_video_id` on video_id
- `idx_video_progress_completed` on completed

**Design Notes**:
- UNIQUE constraint prevents duplicate progress records
- Use UPSERT pattern for updates
- completed = true when watched_seconds >= duration_seconds * 0.95

### Supporting Features

#### push_tokens
**Purpose**: Store device tokens for push notifications

**Columns**:
- `id` (UUID, PK)
- `user_id` (UUID, FK) - References profiles.id
- `token` (TEXT, NOT NULL)
- `platform` (TEXT) - 'ios' | 'android' | 'web'
- `created_at` (TIMESTAMPTZ)
- UNIQUE constraint on (user_id, token)

**RLS Policies**:
- Users can manage (ALL operations) own tokens

**Indexes**:
- `idx_push_tokens_user_id` on user_id

## Data Flow Diagrams

### User Signup Flow
```
1. User signs up via Supabase Auth (auth.users)
2. Trigger: on_auth_user_created fires
3. Creates profile in public.profiles
4. Trigger: on_profile_created fires
5. Creates free entitlement in public.entitlements
```

### Subscription Purchase Flow (Apple)
```
1. User purchases subscription in iOS app
2. App validates receipt with Apple
3. App calls backend webhook endpoint
4. Backend updates entitlements.plan = 'individual'
5. Backend creates record in purchases
```

### Subscription Purchase Flow (Stripe)
```
1. User selects plan on web
2. Create Stripe Checkout Session
3. User completes payment
4. Stripe webhook fires
5. Backend updates entitlements
6. Backend creates record in purchases
```

### Video Watching Flow
```
1. App checks user's entitlement + video.is_free
2. If authorized, load video
3. Periodically update video_progress.watched_seconds
4. When >= 95% watched, set completed = true
```

## Common Queries

### Check if user has access to premium content
```sql
SELECT plan, status
FROM entitlements
WHERE user_id = $1
  AND status = 'active'
  AND plan != 'free';
```

### Get user's learning progress
```sql
SELECT
  m.title as module_title,
  v.title as video_title,
  vp.watched_seconds,
  vp.duration_seconds,
  vp.completed,
  ROUND((vp.watched_seconds::float / NULLIF(vp.duration_seconds, 0)) * 100, 2) as progress_pct
FROM video_progress vp
JOIN videos v ON v.id = vp.video_id
JOIN modules m ON m.id = v.module_id
WHERE vp.user_id = $1
ORDER BY vp.last_watched_at DESC;
```

### Get salon with all staff
```sql
SELECT
  s.*,
  json_agg(p.*) as staff
FROM salons s
LEFT JOIN profiles p ON p.salon_id = s.id
WHERE s.owner_id = $1
GROUP BY s.id;
```

### Get published modules with video count
```sql
SELECT
  m.*,
  COUNT(v.id) as video_count,
  COUNT(CASE WHEN v.is_free THEN 1 END) as free_video_count
FROM modules m
LEFT JOIN videos v ON v.module_id = m.id AND v.is_published = TRUE
WHERE m.is_published = TRUE
GROUP BY m.id
ORDER BY m.sort_order;
```

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data by default
- Admin role checked via JOIN to profiles table
- Public content accessible without authentication

### Sensitive Data
- Never expose service_role key to client
- Use anon key for client-side requests
- Payment webhooks should verify signatures
- Store minimal PII in metadata fields

### Best Practices
- Always check entitlement before serving premium content
- Use transactions for multi-table updates
- Validate external_id uniqueness to prevent duplicate purchases
- Log all subscription changes for audit trail

## Migration Files

- `/supabase/schema.sql` - Complete schema (reference)
- `/supabase/migrations/001_initial_schema.sql` - Production migration
- `/supabase/README.md` - Detailed documentation
- `/supabase/QUICK_START.md` - Quick setup guide
- `/scripts/run-migration.js` - Migration helper script
- `/scripts/verify-schema.js` - Schema verification script

## Next Steps

1. Run the migration in Supabase Dashboard
2. Verify all tables exist
3. Test user signup flow
4. Add sample modules and videos
5. Implement webhook endpoints for payments
6. Set up Supabase Storage buckets for video uploads
7. Configure Edge Functions for server-side logic
