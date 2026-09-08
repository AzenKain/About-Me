import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey(), // "default"
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio").notNull(),
  shortBio: text("short_bio"),
  avatarUrl: text("avatar_url"),
  statusText: text("status_text").default("Available for new opportunities"),
  email: text("email"),
  phone: text("phone").default(""),
  location: text("location"),
  resumeUrl: text("resume_url"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  telegramUrl: text("telegram_url"),
  hobbies: text("hobbies").default(""),
  languages: text("languages").default(""),
  resumeProjectLimit: integer("resume_project_limit").default(2),
  yearsOfExperience: integer("years_of_experience").default(3),
  skillsJson: text("skills_json").default("[]"), // Array of { category: string, items: string[] }
  metaTitle: text("meta_title").default(""),
  metaDescription: text("meta_description").default(""),
  metaKeywords: text("meta_keywords").default(""),
  faviconUrl: text("favicon_url").default(""),
  ogImageUrl: text("og_image_url").default(""),
  updatedAt: integer("updated_at"),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  orderIndex: integer("order_index").default(0),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  fullDescription: text("full_description"),
  categoryId: text("category_id").references(() => categories.id),
  categoryIdsJson: text("category_ids_json").default("[]"), // Array of category IDs
  repoUrl: text("repo_url"),
  liveUrl: text("live_url"),
  techStackJson: text("tech_stack_json").default("[]"), // Array of string tags
  mediaJson: text("media_json").default("[]"), // Array of MediaItem: images, videos, proof links
  role: text("role").default("Creator"), // Role inside the project (e.g. Creator, Lead Architect)
  teamSize: text("team_size").default(""), // Team size e.g. "1 (Solo)", "4 members", "5"
  period: text("period").default(""), // Timeline e.g. 2023 - 2024
  contributions: text("contributions").default(""), // Multiline bullet points describing specific tasks
  isSelected: integer("is_selected", { mode: "boolean" }).default(false), // Selected for resume & primary showcase
  stars: integer("stars").default(0),
  forks: integer("forks").default(0),
  language: text("language"),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  orderIndex: integer("order_index").default(0),
  createdAt: integer("created_at"),
});

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  issuer: text("issuer").notNull(),
  date: text("date").notNull(),
  description: text("description"),
  category: text("category").default("Award"), // "Award" | "Hackathon" | "Certification" | "Honor"
  proofUrl: text("proof_url"),
  mediaJson: text("media_json").default("[]"), // Array of MediaItem: certificates, photos, video demo
  orderIndex: integer("order_index").default(0),
  createdAt: integer("created_at"),
});

export const experiences = sqliteTable("experiences", {
  id: text("id").primaryKey(),
  role: text("role").notNull(),
  company: text("company").notNull(),
  companyUrl: text("company_url"),
  location: text("location"),
  period: text("period").notNull(),
  description: text("description").notNull(),
  mediaJson: text("media_json").default("[]"), // Array of MediaItem: diagrams, product launch videos, references
  orderIndex: integer("order_index").default(0),
  isCurrent: integer("is_current", { mode: "boolean" }).default(false),
});

export const education = sqliteTable("education", {
  id: text("id").primaryKey(),
  degree: text("degree").notNull(), // e.g. "B.S."
  field: text("field").notNull(), // e.g. "Computer Science"
  school: text("school").notNull(), // e.g. "University of Washington"
  period: text("period").notNull(), // e.g. "September 2020 - Current"
  location: text("location"), // e.g. "Seattle, WA"
  courses: text("courses"), // Newline-separated relevant courses
  gpa: text("gpa"),
  orderIndex: integer("order_index").default(0),
  createdAt: integer("created_at"),
});

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey(),
  githubUsername: text("github_username").notNull().unique(),
  createdAt: integer("created_at"),
});

export const systemSettings = sqliteTable("system_settings", {
  id: text("id").primaryKey(), // "default"
  autoSyncEnabled: integer("auto_sync_enabled", { mode: "boolean" }).default(true),
  syncIntervalHours: integer("sync_interval_hours").default(24),
  excludedReposJson: text("excluded_repos_json").default("[]"),
  syncSourcesJson: text("sync_sources_json").default("[]"),
  lastSyncedAt: integer("last_synced_at"),
  lastSyncStatus: text("last_sync_status").default("idle"), // "idle" | "success" | "error"
  lastSyncMessage: text("last_sync_message").default(""),
  updatedAt: integer("updated_at"),
});

export type { MediaItem } from "@/types";

export type Profile = typeof profile.$inferSelect;
export type InsertProfile = typeof profile.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = typeof experiences.$inferInsert;

export type Education = typeof education.$inferSelect;
export type InsertEducation = typeof education.$inferInsert;

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = typeof systemSettings.$inferInsert;
