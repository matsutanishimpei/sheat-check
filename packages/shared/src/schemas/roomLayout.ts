import { z } from 'zod';

export const GridItemTypeSchema = z.enum(['student', 'teacher', 'obstacle', 'door'], {
  description: 'Type of grid item: student seat, teacher desk/area, obstacle, or door',
});

export const GridItemSchema = z.object({
  x: z.number().int().nonnegative('x coordinate must be a non-negative integer'),
  y: z.number().int().nonnegative('y coordinate must be a non-negative integer'),
  type: GridItemTypeSchema,
});

export const SaveRoomLayoutInputSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  grid: z.array(GridItemSchema),
  supabaseUrl: z.string().min(1, 'Supabase URL is required'),
  supabaseAnonKey: z.string().min(1, 'Supabase Anon Key is required'),
  isActive: z.boolean().optional(),
});

