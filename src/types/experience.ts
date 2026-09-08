import { z } from "zod";

export const ExperienceSchema = z.object({
  id: z.string(),
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company is required"),
  companyUrl: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  period: z.string().min(1, "Period is required"),
  description: z.string().min(1, "Description is required"),
  mediaJson: z.string().nullable().optional().default("[]"),
  orderIndex: z.number().int().nullable().optional().default(0),
  isCurrent: z.union([z.boolean(), z.number().transform((n) => Boolean(n))]).nullable().optional().default(false),
});

export const InsertExperienceSchema = ExperienceSchema.extend({
  id: z.string().optional(),
});

export type Experience = z.infer<typeof ExperienceSchema>;
export type InsertExperience = z.infer<typeof InsertExperienceSchema>;
