import { z } from 'zod';
import {
  StudentToTeacherEventSchema,
  TeacherResetEventSchema,
  BroadcastEventSchema,
} from '../schemas/broadcastEvent';

export type StudentToTeacherEvent = z.infer<typeof StudentToTeacherEventSchema>;
export type TeacherResetEvent = z.infer<typeof TeacherResetEventSchema>;
export type BroadcastEvent = z.infer<typeof BroadcastEventSchema>;
