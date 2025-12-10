-- SQL Script to get complete database schema for TypeScript type generation
-- Run this in Supabase SQL Editor: https://lwofrjklqmanklbmbsgz.supabase.co/project/_/sql

-- Get detailed schema for all tables
SELECT
  t.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.column_default,
  c.is_nullable,
  c.is_identity,
  CASE
    WHEN pk.column_name IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END as is_primary_key,
  CASE
    WHEN fk.column_name IS NOT NULL THEN fk.foreign_table_name || '.' || fk.foreign_column_name
    ELSE NULL
  END as foreign_key_reference
FROM information_schema.tables t
JOIN information_schema.columns c
  ON t.table_name = c.table_name
  AND t.table_schema = c.table_schema
LEFT JOIN (
  SELECT
    ku.table_name,
    ku.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
    AND tc.table_schema = ku.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
  SELECT
    ku.table_name,
    ku.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
    AND tc.table_schema = ku.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN (
    'profiles',
    'salons',
    'entitlements',
    'purchases',
    'modules',
    'videos',
    'video_progress',
    'push_tokens'
  )
ORDER BY t.table_name, c.ordinal_position;

-- Get all unique constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
    'profiles',
    'salons',
    'entitlements',
    'purchases',
    'modules',
    'videos',
    'video_progress',
    'push_tokens'
  )
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name, tc.constraint_type;

-- Get all indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'salons',
    'entitlements',
    'purchases',
    'modules',
    'videos',
    'video_progress',
    'push_tokens'
  )
ORDER BY tablename, indexname;
