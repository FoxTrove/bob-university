# Quick Start - Run Database Migration

## Step 1: Open Supabase SQL Editor

The SQL Editor should have opened in your browser. If not, click this link:

**https://supabase.com/dashboard/project/lwofrjklqmanklbmbsgz/sql/new**

## Step 2: Copy the Migration SQL

Run this command to copy the SQL to your clipboard:

```bash
cat supabase/migrations/001_initial_schema.sql | pbcopy
```

Or manually open the file:
```bash
code supabase/migrations/001_initial_schema.sql
```

## Step 3: Paste and Run

1. Paste the SQL into the Supabase SQL Editor
2. Click the "Run" button (or press Cmd+Enter)
3. Wait for success message

## Step 4: Verify Tables Were Created

Run this query in the SQL Editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these 8 tables:
- entitlements
- modules
- profiles
- purchases
- push_tokens
- salons
- video_progress
- videos

## Step 5: Verify Triggers and Functions

Run this query to verify functions were created:

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

You should see:
- handle_new_profile
- handle_new_user

## Troubleshooting

### If you get permission errors:
Make sure you're using the SQL Editor in the Supabase Dashboard (not trying to run via anon key)

### If tables already exist:
The migration uses `CREATE TABLE IF NOT EXISTS` and `DROP POLICY IF EXISTS`, so it's safe to run multiple times.

### If you need to start fresh:
```sql
-- Drop all tables (run in this order)
DROP TABLE IF EXISTS public.push_tokens CASCADE;
DROP TABLE IF EXISTS public.video_progress CASCADE;
DROP TABLE IF EXISTS public.videos CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.entitlements CASCADE;
DROP TABLE IF EXISTS public.salons CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_profile() CASCADE;
```

Then run the migration again.

## Next Steps After Migration

1. Test user signup to verify profile creation trigger
2. Add sample content (modules and videos)
3. Test RLS policies
4. Set up payment webhooks
