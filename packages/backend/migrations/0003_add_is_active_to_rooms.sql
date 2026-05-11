-- Migration: Add is_active column to rooms table
ALTER TABLE rooms ADD COLUMN is_active INTEGER DEFAULT 1;
