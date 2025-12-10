# Bob University Database Schema

This directory contains the database schema and migration files for Bob University.

## Schema Overview

The database consists of 8 main tables:

### Core Tables

1. **profiles** - User profiles (extends auth.users)
   - Stores user information including role (individual, salon_owner, staff, admin)
   - Linked to auth.users with automatic profile creation trigger
   - RLS enabled: users can view/update their own profile

2. **salons** - Salon information for salon owners
   - Stores salon name, owner, and staff limit
   - Linked to profiles via salon_id foreign key
   - RLS enabled: salon owners can manage their own salon

3. **entitlements** - Unified access control for freemium model
   - Tracks user's subscription plan (free, individual, salon)
   - Handles both Apple IAP and Stripe subscriptions
   - Automatically created with 'free' plan on profile creation
   - RLS enabled: users can view their own entitlement

4. **purchases** - Purchase history for both payment rails
   - Records all purchases (subscriptions, certifications, events, merch)
   - Tracks source (apple/stripe), status, and metadata
   - RLS enabled: users can view their own purchases

### Content Tables

5. **modules** - Course modules/categories
   - Organizes video content into modules
   - Has sort_order and is_published flags
   - RLS enabled: public can view published modules, admins can manage all

6. **videos** - Video content
   - Stores video metadata, URLs, transcripts
   - Can be marked as free or premium content
   - Linked to modules via module_id
   - RLS enabled: public can view published videos, admins can manage all

7. **video_progress** - User video watching progress
   - Tracks watched_seconds, completion status, last_watched_at
   - Unique constraint on (user_id, video_id)
   - RLS enabled: users can manage their own progress

### Supporting Tables

8. **push_tokens** - Push notification tokens
   - Stores device tokens for iOS, Android, web
   - RLS enabled: users can manage their own tokens

## Running the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Open the Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/lwofrjklqmanklbmbsgz/sql/new
   ```

2. Copy the contents of `migrations/001_initial_schema.sql`

3. Paste into the SQL Editor and click "Run"

4. Verify tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

### Option 2: Using psql (if you have database password)

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.lwofrjklqmanklbmbsgz.supabase.co:5432/postgres" -f supabase/migrations/001_initial_schema.sql
```

Find your database password in Supabase Dashboard > Settings > Database > Connection string

### Option 3: Helper Script

```bash
node scripts/run-migration.js
```

This will show you the direct links and instructions.

## Database Features

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Users can only access their own data
- Admins have full access to content management
- Public content is accessible to all authenticated users

### Automatic Triggers

1. **on_auth_user_created** - Creates a profile when user signs up
2. **on_profile_created** - Creates a free entitlement when profile is created

### Indexes

Performance indexes are created on:
- Foreign keys (salon_id, user_id, video_id, module_id)
- Frequently queried fields (role, status, is_published, sort_order)
- Lookup fields (external_id for purchases)

## Schema Relationships

```
auth.users (Supabase Auth)
    |
    └─> profiles (1:1)
          |
          ├─> entitlements (1:1)
          ├─> purchases (1:many)
          ├─> video_progress (1:many)
          ├─> push_tokens (1:many)
          └─> salons (1:1 as owner, many:1 as staff via salon_id)

modules (1:many) ─> videos
                      |
                      └─> video_progress (many:1)
```

## Data Access Patterns

### For Individual Users
```typescript
// Get user's entitlement
const { data } = await supabase
  .from('entitlements')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Get user's video progress
const { data } = await supabase
  .from('video_progress')
  .select('*, videos(*)')
  .eq('user_id', user.id);
```

### For Salon Owners
```typescript
// Get salon with staff
const { data } = await supabase
  .from('salons')
  .select('*, profiles!fk_profiles_salon(*)')
  .eq('owner_id', user.id)
  .single();
```

### For Content
```typescript
// Get published modules with videos
const { data } = await supabase
  .from('modules')
  .select('*, videos(*)')
  .eq('is_published', true)
  .order('sort_order');
```

## Next Steps

After running the migration:

1. Verify all tables exist
2. Test user signup to ensure profile and entitlement are created
3. Add sample content (modules and videos)
4. Test RLS policies work correctly
5. Set up webhooks for Apple IAP and Stripe

## Files

- `schema.sql` - Complete schema in one file (for reference)
- `migrations/001_initial_schema.sql` - Migration file to run
- `../scripts/run-migration.js` - Helper script with instructions
- `README.md` - This file
