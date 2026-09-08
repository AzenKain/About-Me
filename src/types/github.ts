import { z } from "zod";

export const GitHubRepoResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  html_url: z.string(),
  homepage: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  language: z.string().nullable(),
  topics: z.array(z.string()).optional(),
  archived: z.boolean(),
  fork: z.boolean(),
  updated_at: z.string(),
});

export type GitHubRepoResponse = z.infer<typeof GitHubRepoResponseSchema>;

export const GitHubSyncResultSchema = z.object({
  success: z.boolean(),
  username: z.string(),
  totalFetched: z.number(),
  updatedCount: z.number(),
  insertedCount: z.number(),
  totalStars: z.number(),
  totalForks: z.number(),
  timestamp: z.number(),
});

export type GitHubSyncResult = z.infer<typeof GitHubSyncResultSchema>;

export const DiscoveredRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  fullName: z.string(),
  htmlUrl: z.string(),
  description: z.string().nullable(),
  stars: z.number(),
  forks: z.number(),
  language: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  isExcluded: z.boolean().default(false),
  sourceType: z.enum(["primary", "org", "user", "repo"]),
  sourceName: z.string(),
});

export type DiscoveredRepo = z.infer<typeof DiscoveredRepoSchema>;
