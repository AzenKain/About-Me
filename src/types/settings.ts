import { z } from "zod";

export const SyncSourceSchema = z.object({
  id: z.string(),
  type: z.enum(["org", "user", "repo"]),
  target: z.string().min(1, "Target cannot be empty"),
  label: z.string().optional(),
  enabled: z.boolean().default(true),
});

export type SyncSource = z.infer<typeof SyncSourceSchema>;

export const SystemSettingsSchema = z.object({
  id: z.string().default("default"),
  autoSyncEnabled: z.union([z.boolean(), z.number().transform((n) => Boolean(n))]).nullable().optional().default(true),
  syncIntervalHours: z.number().int().min(1).max(720).nullable().optional().default(24),
  excludedReposJson: z.string().nullable().optional().default("[]"),
  syncSourcesJson: z.string().nullable().optional().default("[]"),
  lastSyncedAt: z.number().nullable().optional(),
  lastSyncStatus: z.string().nullable().optional().default("idle"),
  lastSyncMessage: z.string().nullable().optional().default(""),
  updatedAt: z.number().nullable().optional(),
});

export const InsertSystemSettingsSchema = SystemSettingsSchema.extend({
  id: z.string().optional().default("default"),
});

export type SystemSettings = z.infer<typeof SystemSettingsSchema>;
export type InsertSystemSettings = z.infer<typeof InsertSystemSettingsSchema>;
