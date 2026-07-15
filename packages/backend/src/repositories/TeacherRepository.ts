export interface Teacher {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface TeacherRepository {
  findByUsername(username: string): Promise<Teacher | null>;
  create(teacher: Omit<Teacher, 'createdAt' | 'lastLoginAt'>): Promise<void>;
  delete(id: string): Promise<void>;
  listAll(): Promise<Omit<Teacher, 'passwordHash'>[]>;
  updateLastLogin(id: string, lastLoginAt: string): Promise<void>;
}
