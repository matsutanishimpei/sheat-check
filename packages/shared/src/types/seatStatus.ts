import { z } from 'zod';
import { SeatStatusTypeSchema, SeatStatusSchema, LiveSeatStatusSchema, RealtimeLogSchema } from '../schemas/seatStatus';

export type SeatStatusType = z.infer<typeof SeatStatusTypeSchema>;
export type SeatStatus = z.infer<typeof SeatStatusSchema>;
export type LiveSeatStatus = z.infer<typeof LiveSeatStatusSchema>;
export type RealtimeLog = z.infer<typeof RealtimeLogSchema>;
