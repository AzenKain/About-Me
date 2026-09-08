import { z } from "zod";

export const AdminSessionUserSchema = z.object({
  id: z.string(),
  loginMethod: z.enum(["passkey", "github"]),
  githubUsername: z.string().optional(),
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
  loggedInAt: z.number(),
});

export type AdminSessionUser = z.infer<typeof AdminSessionUserSchema>;

export const AdminUserSchema = z.object({
  id: z.string(),
  githubUsername: z.string(),
  createdAt: z.number().nullable().optional(),
});

export type AdminUser = z.infer<typeof AdminUserSchema>;
