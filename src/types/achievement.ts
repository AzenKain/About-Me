import { z } from "zod";

export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  issuer: z.string().min(1, "Issuer is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional().default("Award"),
  proofUrl: z.string().nullable().optional(),
  mediaJson: z.string().nullable().optional().default("[]"),
  orderIndex: z.number().int().nullable().optional().default(0),
  createdAt: z.number().nullable().optional(),
});

export const InsertAchievementSchema = AchievementSchema.extend({
  id: z.string().optional(),
});

export type Achievement = z.infer<typeof AchievementSchema>;
export type InsertAchievement = z.infer<typeof InsertAchievementSchema>;
