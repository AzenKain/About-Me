import { z } from "zod";

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  fullDescription: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  categoryIdsJson: z.string().nullable().optional().default("[]"),
  repoUrl: z.string().nullable().optional(),
  liveUrl: z.string().nullable().optional(),
  techStackJson: z.string().nullable().optional().default("[]"),
  mediaJson: z.string().nullable().optional().default("[]"),
  role: z.string().nullable().optional().default("Creator"),
  teamSize: z.string().nullable().optional().default(""),
  period: z.string().nullable().optional().default(""),
  contributions: z.string().nullable().optional().default(""),
  isSelected: z.union([z.boolean(), z.number().transform((n) => Boolean(n))]).nullable().optional().default(false),
  stars: z.number().int().nullable().optional().default(0),
  forks: z.number().int().nullable().optional().default(0),
  language: z.string().nullable().optional(),
  isFeatured: z.union([z.boolean(), z.number().transform((n) => Boolean(n))]).nullable().optional().default(false),
  orderIndex: z.number().int().nullable().optional().default(0),
  createdAt: z.number().nullable().optional(),
});

export const InsertProjectSchema = ProjectSchema.extend({
  id: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;
export type InsertProject = z.infer<typeof InsertProjectSchema>;
