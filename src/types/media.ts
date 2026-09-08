import { z } from "zod";

export const MediaItemSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "video", "link"]),
  url: z.string(),
  title: z.string().optional(),
  caption: z.string().optional(),
  showOnResume: z.boolean().optional(),
});

export type MediaItem = z.infer<typeof MediaItemSchema>;
