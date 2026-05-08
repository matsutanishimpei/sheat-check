import { z } from 'zod';

export const GridItemTypeSchema = z.enum(['student', 'teacher', 'obstacle', 'door'], {
  description: 'Type of grid item: student seat, teacher desk/area, obstacle, or door',
});

export const GridItemSchema = z.object({
  x: z.number().int().nonnegative('x coordinate must be a non-negative integer'),
  y: z.number().int().nonnegative('y coordinate must be a non-negative integer'),
  type: GridItemTypeSchema,
});

export const RoomLayoutSchema = z.object({
  roomName: z.string().min(1, 'Room name is required'),
  caseName: z.string().min(1, 'Case name is required'),
  grid: z.array(GridItemSchema),
});

export const SaveRoomLayoutInputSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  layouts: z.array(RoomLayoutSchema)
    .min(1, 'At least one layout is required')
    .max(5, 'A maximum of 5 layouts (cases) can be saved'),
});

