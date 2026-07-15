import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  layoutData: text('layout_data').notNull(),
  supabaseUrl: text('supabase_url'),
  supabaseAnonKey: text('supabase_anon_key'),
  isActive: integer('is_active').default(1),
});

export const teachers = sqliteTable('teachers', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastLoginAt: text('last_login_at'),
});
