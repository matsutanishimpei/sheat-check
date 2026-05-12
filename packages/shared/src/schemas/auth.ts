import { z } from 'zod';

export const TeacherLoginInputSchema = z.object({
  username: z.string().trim().min(3, 'ユーザー名は3文字以上である必要があります'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
});
