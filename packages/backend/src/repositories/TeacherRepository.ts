export interface Teacher {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface TeacherRepository {
  findByUsername(username: string): Promise<Teacher | null>;
  create(teacher: Omit<Teacher, 'createdAt'>): Promise<void>;
  delete(id: string): Promise<void>;
  listAll(): Promise<Omit<Teacher, 'passwordHash'>[]>;
}
