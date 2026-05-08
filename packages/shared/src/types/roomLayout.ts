import { z } from 'zod';
import { GridItemTypeSchema, GridItemSchema, RoomLayoutSchema, SaveRoomLayoutInputSchema } from '../schemas/roomLayout';

export type GridItemType = z.infer<typeof GridItemTypeSchema>;
export type GridItem = z.infer<typeof GridItemSchema>;
export type RoomLayout = z.infer<typeof RoomLayoutSchema>;
export type SaveRoomLayoutInput = z.infer<typeof SaveRoomLayoutInputSchema>;

