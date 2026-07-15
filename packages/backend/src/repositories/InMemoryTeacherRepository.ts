import { Teacher, TeacherRepository } from './TeacherRepository';

export class InMemoryTeacherRepository implements TeacherRepository {
  private teachers: Map<string, Teacher> = new Map();

  constructor() {
    // Seed a default admin teacher for mock tests (password: admin123)
    this.teachers.set('teacher-default-uuid', {
      id: 'teacher-default-uuid',
      username: 'teacher_admin',
      passwordHash: '$2b$10$Pil//x0RyM4ziFc81f6tWOdjCrHr.KiFY1X8aPr2DGivoEk77vpRG',
      createdAt: new Date().toISOString(),
    });
  }

  async findByUsername(username: string): Promise<Teacher | null> {
    for (const teacher of this.teachers.values()) {
      if (teacher.username === username) {
        return teacher;
      }
    }
    return null;
  }

  async create(teacher: Omit<Teacher, 'createdAt'>): Promise<void> {
    this.teachers.set(teacher.id, {
      ...teacher,
      createdAt: new Date().toISOString()
    });
  }

  async delete(id: string): Promise<void> {
    this.teachers.delete(id);
  }

  async listAll(): Promise<Omit<Teacher, 'passwordHash'>[]> {
    return Array.from(this.teachers.values()).map((t) => ({
      id: t.id,
      username: t.username,
      createdAt: t.createdAt,
      lastLoginAt: t.lastLoginAt
    })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateLastLogin(id: string, lastLoginAt: string): Promise<void> {
    const teacher = this.teachers.get(id);
    if (teacher) {
      this.teachers.set(id, {
        ...teacher,
        lastLoginAt
      });
    }
  }

  // Helper method for testing
  addTeacher(teacher: Teacher): void {
    this.teachers.set(teacher.id, teacher);
  }
}
