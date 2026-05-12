import { z } from 'zod';
import { TeacherLoginInputSchema } from '../schemas/auth';

export type TeacherLoginInput = z.infer<typeof TeacherLoginInputSchema>;
