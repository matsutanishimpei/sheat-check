import { eq, desc } from 'drizzle-orm';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { Teacher, TeacherRepository } from './TeacherRepository';
import * as schema from '../db/schema';

export class DrizzleTeacherRepository implements TeacherRepository {
  constructor(private db: BaseSQLiteDatabase<any, any, any, any>) {}

  async findByUsername(username: string): Promise<Teacher | null> {
    const results = await this.db
      .select()
      .from(schema.teachers)
      .where(eq(schema.teachers.username, username))
      .limit(1)
      .all();

    const result = results[0];
    if (!result) {
      return null;
    }

    return {
      id: result.id,
      username: result.username,
      passwordHash: result.passwordHash,
      createdAt: result.createdAt,
      lastLoginAt: result.lastLoginAt,
    };
  }

  async create(teacher: Omit<Teacher, 'createdAt'>): Promise<void> {
    await this.db
      .insert(schema.teachers)
      .values({
        id: teacher.id,
        username: teacher.username,
        passwordHash: teacher.passwordHash,
      })
      .run();
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(schema.teachers)
      .where(eq(schema.teachers.id, id))
      .run();
  }

  async listAll(): Promise<Omit<Teacher, 'passwordHash'>[]> {
    const results = await this.db
      .select({
        id: schema.teachers.id,
        username: schema.teachers.username,
        createdAt: schema.teachers.createdAt,
        lastLoginAt: schema.teachers.lastLoginAt,
      })
      .from(schema.teachers)
      .orderBy(desc(schema.teachers.createdAt))
      .all();

    return results;
  }

  async updateLastLogin(id: string, lastLoginAt: string): Promise<void> {
    await this.db
      .update(schema.teachers)
      .set({ lastLoginAt })
      .where(eq(schema.teachers.id, id))
      .run();
  }
}
