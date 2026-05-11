import { z } from 'zod';
import { GridItemTypeSchema, GridItemSchema, SaveRoomLayoutInputSchema } from '../schemas/roomLayout';

export type GridItemType = z.infer<typeof GridItemTypeSchema>;
export type GridItem = z.infer<typeof GridItemSchema>;
export type SaveRoomLayoutInput = z.infer<typeof SaveRoomLayoutInputSchema>;

