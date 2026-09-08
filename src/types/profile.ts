import { z } from "zod";

export const SkillCategorySchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
});

export type SkillCategory = z.infer<typeof SkillCategorySchema>;

export const ProfileSchema = z.object({
  id: z.string().default("default"),
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  bio: z.string().min(1, "Bio is required"),
  shortBio: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  statusText: z.string().nullable().optional().default("Available for new opportunities"),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional().default(""),
  location: z.string().nullable().optional(),
  resumeUrl: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  twitterUrl: z.string().nullable().optional(),
  telegramUrl: z.string().nullable().optional(),
  hobbies: z.string().nullable().optional().default(""),
  languages: z.string().nullable().optional().default(""),
  resumeProjectLimit: z.number().int().nullable().optional().default(2),
  yearsOfExperience: z.number().int().nullable().optional().default(3),
  skillsJson: z.string().nullable().optional().default("[]"),
  metaTitle: z.string().nullable().optional().default(""),
  metaDescription: z.string().nullable().optional().default(""),
  metaKeywords: z.string().nullable().optional().default(""),
  faviconUrl: z.string().nullable().optional().default(""),
  ogImageUrl: z.string().nullable().optional().default(""),
  updatedAt: z.number().nullable().optional(),
});

export const InsertProfileSchema = ProfileSchema.extend({
  id: z.string().optional().default("default"),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type InsertProfile = z.infer<typeof InsertProfileSchema>;
