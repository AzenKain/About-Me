import { z } from "zod";
import { ProfileSchema } from "./profile";
import { CategorySchema } from "./category";
import { ProjectSchema } from "./project";
import { AchievementSchema } from "./achievement";
import { ExperienceSchema } from "./experience";
import { EducationSchema } from "./education";
import { SystemSettingsSchema } from "./settings";

export const BackupDataSchema = z.object({
  profile: ProfileSchema.nullable().optional(),
  categories: z.array(CategorySchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  achievements: z.array(AchievementSchema).default([]),
  experiences: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  systemSettings: SystemSettingsSchema.nullable().optional(),
  exportedAt: z.union([z.number(), z.string()]).optional(),
  version: z.union([z.number(), z.string()]).optional(),
});

export type BackupData = z.infer<typeof BackupDataSchema>;

export interface ImportBackupResult {
  success: boolean;
  message: string;
  counts?: {
    categories: number;
    projects: number;
    achievements: number;
    experiences: number;
    education: number;
    profileUpdated: boolean;
    settingsUpdated: boolean;
  };
  errors?: string[];
}
