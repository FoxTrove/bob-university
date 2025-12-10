#!/usr/bin/env node

/**
 * Schema Creation Script for Bob University
 * Executes SQL commands against Supabase database using the Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL statements organized by table
const sqlStatements = [
  {
    name: 'profiles',
    sql: `
      -- Profiles table
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        role TEXT DEFAULT 'individual' CHECK (role IN ('individual', 'salon_owner', 'staff', 'admin')),
        salon_id UUID,
        years_experience INTEGER,
        location TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'profiles_rls',
    sql: `
      -- Enable RLS on profiles
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'profiles_policies',
    sql: `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

      -- Create policies
      CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
      CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
      CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    `
  },
  {
    name: 'profiles_trigger',
    sql: `
      -- Trigger to auto-create profile on signup
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, avatar_url)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `
  },
  {
    name: 'salons',
    sql: `
      -- Salons table
      CREATE TABLE IF NOT EXISTS public.salons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        max_staff INTEGER DEFAULT 5,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'profiles_salon_fk',
    sql: `
      -- Add foreign key to profiles (if not exists)
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_salon'
        ) THEN
          ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_salon
            FOREIGN KEY (salon_id) REFERENCES public.salons(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `
  },
  {
    name: 'salons_rls',
    sql: `
      ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'salons_policies',
    sql: `
      DROP POLICY IF EXISTS "Salon owners can view own salon" ON public.salons;
      DROP POLICY IF EXISTS "Salon owners can update own salon" ON public.salons;
      DROP POLICY IF EXISTS "Users can create salons" ON public.salons;

      CREATE POLICY "Salon owners can view own salon" ON public.salons FOR SELECT USING (auth.uid() = owner_id);
      CREATE POLICY "Salon owners can update own salon" ON public.salons FOR UPDATE USING (auth.uid() = owner_id);
      CREATE POLICY "Users can create salons" ON public.salons FOR INSERT WITH CHECK (auth.uid() = owner_id);
    `
  },
  {
    name: 'entitlements',
    sql: `
      CREATE TABLE IF NOT EXISTS public.entitlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'individual', 'salon')),
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'expired')),
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `
  },
  {
    name: 'entitlements_rls',
    sql: `
      ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'entitlements_policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view own entitlement" ON public.entitlements;
      CREATE POLICY "Users can view own entitlement" ON public.entitlements FOR SELECT USING (auth.uid() = user_id);
    `
  },
  {
    name: 'entitlements_trigger',
    sql: `
      CREATE OR REPLACE FUNCTION public.handle_new_profile()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.entitlements (user_id, plan, status)
        VALUES (NEW.id, 'free', 'active');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
      CREATE TRIGGER on_profile_created
        AFTER INSERT ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();
    `
  },
  {
    name: 'purchases',
    sql: `
      CREATE TABLE IF NOT EXISTS public.purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        source TEXT NOT NULL CHECK (source IN ('apple', 'stripe')),
        product_type TEXT NOT NULL CHECK (product_type IN ('subscription', 'certification', 'event', 'merch')),
        product_id TEXT NOT NULL,
        external_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        amount_cents INTEGER,
        currency TEXT DEFAULT 'USD',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'purchases_rls',
    sql: `
      ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'purchases_policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
      CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
    `
  },
  {
    name: 'modules',
    sql: `
      CREATE TABLE IF NOT EXISTS public.modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        thumbnail_url TEXT,
        sort_order INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'modules_rls',
    sql: `
      ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'modules_policies',
    sql: `
      DROP POLICY IF EXISTS "Anyone can view published modules" ON public.modules;
      DROP POLICY IF EXISTS "Admins can manage modules" ON public.modules;

      CREATE POLICY "Anyone can view published modules" ON public.modules FOR SELECT USING (is_published = TRUE);
      CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
    `
  },
  {
    name: 'videos',
    sql: `
      CREATE TABLE IF NOT EXISTS public.videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration_seconds INTEGER,
        sort_order INTEGER DEFAULT 0,
        is_free BOOLEAN DEFAULT FALSE,
        is_published BOOLEAN DEFAULT FALSE,
        transcript TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'videos_rls',
    sql: `
      ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'videos_policies',
    sql: `
      DROP POLICY IF EXISTS "Anyone can view published videos metadata" ON public.videos;
      DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;

      CREATE POLICY "Anyone can view published videos metadata" ON public.videos FOR SELECT USING (is_published = TRUE);
      CREATE POLICY "Admins can manage videos" ON public.videos FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
    `
  },
  {
    name: 'video_progress',
    sql: `
      CREATE TABLE IF NOT EXISTS public.video_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
        watched_seconds INTEGER DEFAULT 0,
        duration_seconds INTEGER,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMPTZ,
        last_watched_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, video_id)
      );
    `
  },
  {
    name: 'video_progress_rls',
    sql: `
      ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'video_progress_policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view own progress" ON public.video_progress;
      DROP POLICY IF EXISTS "Users can update own progress" ON public.video_progress;
      DROP POLICY IF EXISTS "Users can insert own progress" ON public.video_progress;

      CREATE POLICY "Users can view own progress" ON public.video_progress FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can update own progress" ON public.video_progress FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own progress" ON public.video_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
    `
  },
  {
    name: 'push_tokens',
    sql: `
      CREATE TABLE IF NOT EXISTS public.push_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        token TEXT NOT NULL,
        platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, token)
      );
    `
  },
  {
    name: 'push_tokens_rls',
    sql: `
      ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'push_tokens_policies',
    sql: `
      DROP POLICY IF EXISTS "Users can manage own tokens" ON public.push_tokens;
      CREATE POLICY "Users can manage own tokens" ON public.push_tokens FOR ALL USING (auth.uid() = user_id);
    `
  },
  {
    name: 'indexes',
    sql: `
      -- Profiles indexes
      CREATE INDEX IF NOT EXISTS idx_profiles_salon_id ON public.profiles(salon_id);
      CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

      -- Entitlements indexes
      CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON public.entitlements(user_id);
      CREATE INDEX IF NOT EXISTS idx_entitlements_status ON public.entitlements(status);

      -- Purchases indexes
      CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_source ON public.purchases(source);
      CREATE INDEX IF NOT EXISTS idx_purchases_external_id ON public.purchases(external_id);

      -- Modules indexes
      CREATE INDEX IF NOT EXISTS idx_modules_published ON public.modules(is_published);
      CREATE INDEX IF NOT EXISTS idx_modules_sort_order ON public.modules(sort_order);

      -- Videos indexes
      CREATE INDEX IF NOT EXISTS idx_videos_module_id ON public.videos(module_id);
      CREATE INDEX IF NOT EXISTS idx_videos_published ON public.videos(is_published);
      CREATE INDEX IF NOT EXISTS idx_videos_sort_order ON public.videos(sort_order);

      -- Video progress indexes
      CREATE INDEX IF NOT EXISTS idx_video_progress_user_id ON public.video_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON public.video_progress(video_id);
      CREATE INDEX IF NOT EXISTS idx_video_progress_completed ON public.video_progress(completed);

      -- Push tokens indexes
      CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
    `
  }
];

async function executeSQL(name, sql) {
  try {
    console.log(`\nExecuting: ${name}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct execution via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        console.error(`  Error: ${error.message}`);
        return { success: false, error: error.message };
      }
    }

    console.log(`  Success!`);
    return { success: true };
  } catch (err) {
    console.error(`  Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('Bob University - Database Schema Creation');
  console.log('==========================================\n');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Using service key: ${supabaseServiceKey.substring(0, 20)}...`);

  const results = {
    success: [],
    failed: []
  };

  for (const statement of sqlStatements) {
    const result = await executeSQL(statement.name, statement.sql);
    if (result.success) {
      results.success.push(statement.name);
    } else {
      results.failed.push({ name: statement.name, error: result.error });
    }
  }

  console.log('\n\n==========================================');
  console.log('Summary');
  console.log('==========================================');
  console.log(`\nSuccessful: ${results.success.length}`);
  results.success.forEach(name => console.log(`  - ${name}`));

  if (results.failed.length > 0) {
    console.log(`\nFailed: ${results.failed.length}`);
    results.failed.forEach(({ name, error }) => console.log(`  - ${name}: ${error}`));
  }

  console.log('\n\nTo verify tables were created, run:');
  console.log('  SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';');
}

main().catch(console.error);
