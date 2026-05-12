import { D1Database } from '@cloudflare/workers-types';
import { Teacher, TeacherRepository } from './TeacherRepository';

export class D1TeacherRepository implements TeacherRepository {
  constructor(private db: D1Database) {}

  async findByUsername(username: string): Promise<Teacher | null> {
    const query = 'SELECT id, username, password_hash, created_at FROM teachers WHERE username = ? LIMIT 1';
    const result = await this.db.prepare(query).bind(username).first<any>();

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      username: result.username,
      passwordHash: result.password_hash,
      createdAt: result.created_at,
    };
  }

  async create(teacher: Omit<Teacher, 'createdAt'>): Promise<void> {
    const query = 'INSERT INTO teachers (id, username, password_hash) VALUES (?, ?, ?)';
    await this.db.prepare(query).bind(teacher.id, teacher.username, teacher.passwordHash).run();
  }

  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM teachers WHERE id = ?';
    await this.db.prepare(query).bind(id).run();
  }

  async listAll(): Promise<Omit<Teacher, 'passwordHash'>[]> {
    const query = 'SELECT id, username, created_at FROM teachers ORDER BY created_at DESC';
    const { results } = await this.db.prepare(query).all<any>();

    if (!results) {
      return [];
    }

    return results.map((result) => ({
      id: result.id,
      username: result.username,
      createdAt: result.created_at,
    }));
  }
}
