import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required"),
  orderIndex: z.number().int().default(0),
});

export const InsertCategorySchema = CategorySchema.extend({
  id: z.string().optional(),
});

export type Category = z.infer<typeof CategorySchema>;
export type InsertCategory = z.infer<typeof InsertCategorySchema>;
