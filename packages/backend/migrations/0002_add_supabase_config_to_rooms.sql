-- Migration: Add supabase config columns to rooms table
ALTER TABLE rooms ADD COLUMN supabase_url TEXT;
ALTER TABLE rooms ADD COLUMN supabase_anon_key TEXT;
