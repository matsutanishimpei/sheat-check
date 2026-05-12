-- Migration: Create teachers table and seed default teacher account
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

