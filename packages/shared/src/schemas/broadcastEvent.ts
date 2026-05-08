import { z } from 'zod';
import { SeatStatusTypeSchema } from './seatStatus';

/**
 * 1. 学生から教員への送信フォーマット
 * Format for data sent from a student to the teacher.
 */
export const StudentToTeacherEventSchema = z.object({
  seatId: z.string().min(1, 'Seat ID is required'),
  status: SeatStatusTypeSchema,
  studentName: z.string().min(1, 'Student name is required'),
  comment: z.string().nullable().optional(),
});

/**
 * 2. 教員から全学生へのリセット信号フォーマット
 * Format for the reset signal sent from a teacher to all students.
 */
export const TeacherResetEventSchema = z.object({
  reset: z.literal(true),
});

/**
 * 3. 共通ブロードキャストイベント（送信・受信メッセージの判別用）
 * Combined broadcast event schema utilizing discriminated union for type-safe message parsing.
 */
export const BroadcastEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('student_to_teacher'),
    payload: StudentToTeacherEventSchema,
  }),
  z.object({
    type: z.literal('teacher_reset'),
    payload: TeacherResetEventSchema,
  }),
]);
