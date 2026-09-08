"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getSession, createSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { profile, categories, projects, achievements, experiences, education } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { syncAllGithubRepos, clearAllProjects, getDiscoveredGithubRepos } from "@/lib/github/sync";
import { invalidatePortfolioCache, updateSystemSettingsDb } from "@/lib/db/queries";
import { verifyPassword } from "@/lib/auth/password";
import { BackupDataSchema, ImportBackupResult } from "@/types";

function internalRevalidate() {
  invalidatePortfolioCache();
  revalidatePath("/", "layout");
  revalidatePath("/resume", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/resume");
  revalidatePath("/admin");
}

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: Admin session required");
  }
  return session;
}

// 1. Passkey Login for Dev / Emergency
export async function loginWithPasskey(passkey: string) {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";

  // Per-IP rate limit: 5 attempts per 15 minutes
  const ipLimit = checkRateLimit(`passkey_ip_${ip}`, 5, 15 * 60 * 1000);
  if (!ipLimit.success) {
    return {
      success: false,
      error: "Too many failed attempts from your IP. Please wait 15 minutes before trying again.",
    };
  }

  // Global circuit breaker: 50 attempts per 15 minutes to prevent distributed brute-forcing
  const globalLimit = checkRateLimit("passkey_global", 50, 15 * 60 * 1000);
  if (!globalLimit.success) {
    return {
      success: false,
      error: "Global login attempt threshold exceeded. Please try again later.",
    };
  }

  const storedSecret =
    process.env.ADMIN_PASSKEY_HASH ||
    process.env.ADMIN_PASSKEY ||
    (process.env.NODE_ENV !== "production" ? "admin123456" : null);

  if (!storedSecret) {
    return {
      success: false,
      error: "Passkey authentication is disabled in production. Use GitHub OAuth.",
    };
  }

  const isValid = verifyPassword(passkey, storedSecret);

  if (!isValid) {
    return {
      success: false,
      error: `Invalid passkey. ${ipLimit.remaining} attempt(s) remaining.`,
    };
  }

  await createSession({
    username: "admin",
    name: "System Administrator",
    role: "admin",
  });

  return { success: true };
}

// 2. Profile Management
const ProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  bio: z.string().min(1, "Bio is required"),
  shortBio: z.string().optional(),
  avatarUrl: z.string().url("Must be a valid URL").or(z.string().length(0)).optional(),
  statusText: z.string().optional(),
  email: z.string().email("Invalid email").or(z.string().length(0)).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  resumeUrl: z.string().optional(),
  githubUrl: z.string().url().or(z.string().length(0)).optional(),
  linkedinUrl: z.string().url().or(z.string().length(0)).optional(),
  twitterUrl: z.string().url().or(z.string().length(0)).optional(),
  telegramUrl: z.string().url().or(z.string().length(0)).optional(),
  hobbies: z.string().optional(),
  languages: z.string().optional(),
  resumeProjectLimit: z.number().int().min(1).max(10).default(2),
  yearsOfExperience: z.number().int().min(0).max(50).default(3).optional(),
  skillsJson: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  faviconUrl: z.string().optional(),
  ogImageUrl: z.string().optional(),
});

export async function updateProfile(formData: z.infer<typeof ProfileSchema>) {
  await requireAdmin();
  const validated = ProfileSchema.parse(formData);

  await db
    .update(profile)
    .set({
      name: validated.name,
      title: validated.title,
      bio: validated.bio,
      shortBio: validated.shortBio || "",
      avatarUrl: validated.avatarUrl || "",
      statusText: validated.statusText || "",
      email: validated.email || "",
      phone: validated.phone || "",
      location: validated.location || "",
      resumeUrl: validated.resumeUrl || "",
      githubUrl: validated.githubUrl || "",
      linkedinUrl: validated.linkedinUrl || "",
      twitterUrl: validated.twitterUrl || "",
      telegramUrl: validated.telegramUrl || "",
      hobbies: validated.hobbies || "",
      languages: validated.languages || "",
      resumeProjectLimit: validated.resumeProjectLimit || 2,
      yearsOfExperience: validated.yearsOfExperience ?? 3,
      skillsJson: validated.skillsJson || "[]",
      metaTitle: validated.metaTitle || "",
      metaDescription: validated.metaDescription || "",
      metaKeywords: validated.metaKeywords || "",
      faviconUrl: validated.faviconUrl || "",
      ogImageUrl: validated.ogImageUrl || "",
      updatedAt: Date.now(),
    })
    .where(eq(profile.id, "default"));

  internalRevalidate();
  return { success: true };
}

// 3. Project Management
const ProjectSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  fullDescription: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  categoryIdsJson: z.string().default("[]"),
  repoUrl: z.string().url("Must be valid URL").or(z.string().length(0)).optional(),
  liveUrl: z.string().url("Must be valid URL").or(z.string().length(0)).optional(),
  techStackJson: z.string().default("[]"),
  mediaJson: z.string().default("[]"),
  role: z.string().default("Creator"),
  teamSize: z.string().optional(),
  period: z.string().optional(),
  contributions: z.string().optional(),
  isSelected: z.boolean().default(false),
  stars: z.number().int().default(0),
  forks: z.number().int().default(0),
  language: z.string().optional(),
  isFeatured: z.boolean().default(false),
  orderIndex: z.number().int().default(0),
});

export async function saveProject(data: z.infer<typeof ProjectSchema>) {
  await requireAdmin();
  const val = ProjectSchema.parse(data);
  const id = val.id || `proj-${crypto.randomBytes(6).toString("hex")}`;

  // Derive primary categoryId from categoryIdsJson if provided
  let primaryCatId = val.categoryId || null;
  try {
    const ids = JSON.parse(val.categoryIdsJson || "[]");
    if (Array.isArray(ids) && ids.length > 0 && !primaryCatId) {
      primaryCatId = ids[0];
    }
  } catch {}

  const exists = val.id
    ? await db.select().from(projects).where(eq(projects.id, val.id)).limit(1)
    : [];

  if (exists.length > 0) {
    await db
      .update(projects)
      .set({
        title: val.title,
        slug: val.slug,
        description: val.description,
        fullDescription: val.fullDescription || "",
        categoryId: primaryCatId,
        categoryIdsJson: val.categoryIdsJson || "[]",
        repoUrl: val.repoUrl || "",
        liveUrl: val.liveUrl || "",
        techStackJson: val.techStackJson,
        mediaJson: val.mediaJson,
        role: val.role || "Creator",
        teamSize: val.teamSize || "",
        period: val.period || "",
        contributions: val.contributions || "",
        isSelected: val.isSelected,
        stars: val.stars,
        forks: val.forks,
        language: val.language || "TypeScript",
        isFeatured: val.isFeatured,
        orderIndex: val.orderIndex,
      })
      .where(eq(projects.id, id));
  } else {
    await db.insert(projects).values({
      id,
      title: val.title,
      slug: val.slug,
      description: val.description,
      fullDescription: val.fullDescription || "",
      categoryId: primaryCatId,
      categoryIdsJson: val.categoryIdsJson || "[]",
      repoUrl: val.repoUrl || "",
      liveUrl: val.liveUrl || "",
      techStackJson: val.techStackJson,
      mediaJson: val.mediaJson,
      role: val.role || "Creator",
      teamSize: val.teamSize || "",
      period: val.period || "",
      contributions: val.contributions || "",
      isSelected: val.isSelected,
      stars: val.stars,
      forks: val.forks,
      language: val.language || "TypeScript",
      isFeatured: val.isFeatured,
      orderIndex: val.orderIndex,
      createdAt: Date.now(),
    });
  }

  internalRevalidate();
  return { success: true, id };
}

export async function toggleProjectSelected(id: string, isSelected: boolean) {
  await requireAdmin();
  await db.update(projects).set({ isSelected }).where(eq(projects.id, id));
  internalRevalidate();
  return { success: true };
}

export async function deleteProject(id: string) {
  await requireAdmin();
  await db.delete(projects).where(eq(projects.id, id));
  internalRevalidate();
  return { success: true };
}

// 4. Achievement Management
const AchievementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  issuer: z.string().min(1, "Issuer is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  category: z.string().default("Award"),
  proofUrl: z.string().url("Must be valid URL").or(z.string().length(0)).optional(),
  mediaJson: z.string().default("[]"),
  orderIndex: z.number().int().default(0),
});

export async function saveAchievement(data: z.infer<typeof AchievementSchema>) {
  await requireAdmin();
  const val = AchievementSchema.parse(data);
  const id = val.id || `ach-${crypto.randomBytes(6).toString("hex")}`;

  const exists = val.id
    ? await db.select().from(achievements).where(eq(achievements.id, val.id)).limit(1)
    : [];

  if (exists.length > 0) {
    await db
      .update(achievements)
      .set({
        title: val.title,
        issuer: val.issuer,
        date: val.date,
        description: val.description || "",
        category: val.category,
        proofUrl: val.proofUrl || "",
        mediaJson: val.mediaJson,
        orderIndex: val.orderIndex,
      })
      .where(eq(achievements.id, id));
  } else {
    await db.insert(achievements).values({
      id,
      title: val.title,
      issuer: val.issuer,
      date: val.date,
      description: val.description || "",
      category: val.category,
      proofUrl: val.proofUrl || "",
      mediaJson: val.mediaJson,
      orderIndex: val.orderIndex,
      createdAt: Date.now(),
    });
  }

  internalRevalidate();
  return { success: true, id };
}

export async function deleteAchievement(id: string) {
  await requireAdmin();
  await db.delete(achievements).where(eq(achievements.id, id));
  internalRevalidate();
  return { success: true };
}

// 5. Experience Management
const ExperienceSchema = z.object({
  id: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company is required"),
  companyUrl: z.string().url().or(z.string().length(0)).optional(),
  location: z.string().optional(),
  period: z.string().min(1, "Period is required"),
  description: z.string().min(1, "Description is required"),
  mediaJson: z.string().default("[]"),
  orderIndex: z.number().int().default(0),
  isCurrent: z.boolean().default(false),
});

export async function saveExperience(data: z.infer<typeof ExperienceSchema>) {
  await requireAdmin();
  const val = ExperienceSchema.parse(data);
  const id = val.id || `exp-${crypto.randomBytes(6).toString("hex")}`;

  const exists = val.id
    ? await db.select().from(experiences).where(eq(experiences.id, val.id)).limit(1)
    : [];

  if (exists.length > 0) {
    await db
      .update(experiences)
      .set({
        role: val.role,
        company: val.company,
        companyUrl: val.companyUrl || "",
        location: val.location || "",
        period: val.period,
        description: val.description,
        mediaJson: val.mediaJson,
        orderIndex: val.orderIndex,
        isCurrent: val.isCurrent,
      })
      .where(eq(experiences.id, id));
  } else {
    await db.insert(experiences).values({
      id,
      role: val.role,
      company: val.company,
      companyUrl: val.companyUrl || "",
      location: val.location || "",
      period: val.period,
      description: val.description,
      mediaJson: val.mediaJson,
      orderIndex: val.orderIndex,
      isCurrent: val.isCurrent,
    });
  }

  internalRevalidate();
  return { success: true, id };
}

export async function deleteExperience(id: string) {
  await requireAdmin();
  await db.delete(experiences).where(eq(experiences.id, id));
  internalRevalidate();
  return { success: true };
}

// 6. Categories Management
const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  orderIndex: z.number().int().default(0),
});

export async function saveCategory(data: z.infer<typeof CategorySchema>) {
  await requireAdmin();
  const val = CategorySchema.parse(data);
  const id = val.id || `cat-${crypto.randomBytes(6).toString("hex")}`;

  const exists = val.id
    ? await db.select().from(categories).where(eq(categories.id, val.id)).limit(1)
    : [];

  if (exists.length > 0) {
    await db
      .update(categories)
      .set({
        name: val.name,
        slug: val.slug,
        orderIndex: val.orderIndex,
      })
      .where(eq(categories.id, id));
  } else {
    await db.insert(categories).values({
      id,
      name: val.name,
      slug: val.slug,
      orderIndex: val.orderIndex,
    });
  }

  internalRevalidate();
  return { success: true, id };
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  internalRevalidate();
  return { success: true };
}

// 7. Education Management
const EducationSchema = z.object({
  id: z.string().optional(),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().min(1, "Field of study is required"),
  school: z.string().min(1, "School/University is required"),
  period: z.string().min(1, "Period is required"),
  location: z.string().optional(),
  courses: z.string().optional(),
  gpa: z.string().optional(),
  orderIndex: z.number().int().default(0),
});

export async function saveEducation(data: z.infer<typeof EducationSchema>) {
  await requireAdmin();
  const val = EducationSchema.parse(data);
  const id = val.id || `edu-${crypto.randomBytes(6).toString("hex")}`;

  const exists = val.id
    ? await db.select().from(education).where(eq(education.id, val.id)).limit(1)
    : [];

  if (exists.length > 0) {
    await db
      .update(education)
      .set({
        degree: val.degree,
        field: val.field,
        school: val.school,
        period: val.period,
        location: val.location || "",
        courses: val.courses || "",
        gpa: val.gpa || "",
        orderIndex: val.orderIndex,
      })
      .where(eq(education.id, id));
  } else {
    await db.insert(education).values({
      id,
      degree: val.degree,
      field: val.field,
      school: val.school,
      period: val.period,
      location: val.location || "",
      courses: val.courses || "",
      gpa: val.gpa || "",
      orderIndex: val.orderIndex,
      createdAt: Date.now(),
    });
  }

  internalRevalidate();
  return { success: true, id };
}

export async function deleteEducation(id: string) {
  await requireAdmin();
  await db.delete(education).where(eq(education.id, id));
  internalRevalidate();
  return { success: true };
}

// 7. Manual Cache Invalidation
export async function triggerRevalidation() {
  await requireAdmin();
  internalRevalidate();
  return { success: true, timestamp: Date.now() };
}

// 8. GitHub Real-time & Auto Sync
export async function syncAllReposAction(username?: string) {
  await requireAdmin();
  try {
    const res = await syncAllGithubRepos(username);
    const skippedNote = res.skippedCount ? `, ${res.skippedCount} excluded` : "";
    await updateSystemSettingsDb({
      lastSyncedAt: Date.now(),
      lastSyncStatus: "success",
      lastSyncMessage: `Successfully synchronized ${res.totalFetched} repositories (${res.updatedCount} updated, ${res.insertedCount} added${skippedNote})`,
    });
    internalRevalidate();
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "GitHub sync failed";
    await updateSystemSettingsDb({
      lastSyncedAt: Date.now(),
      lastSyncStatus: "error",
      lastSyncMessage: msg,
    });
    internalRevalidate();
    throw err;
  }
}

export async function clearAllProjectsAction() {
  await requireAdmin();
  const res = await clearAllProjects();
  internalRevalidate();
  return res;
}

// 9. System & Sync Settings
const SystemSettingsSchema = z.object({
  autoSyncEnabled: z.boolean(),
  syncIntervalHours: z.number().int().min(1).max(720),
  excludedReposJson: z.string().optional(),
  syncSourcesJson: z.string().optional(),
});

export async function updateSystemSettingsAction(data: z.infer<typeof SystemSettingsSchema>) {
  await requireAdmin();
  const val = SystemSettingsSchema.parse(data);
  await updateSystemSettingsDb({
    autoSyncEnabled: val.autoSyncEnabled,
    syncIntervalHours: val.syncIntervalHours,
    ...(val.excludedReposJson !== undefined ? { excludedReposJson: val.excludedReposJson } : {}),
    ...(val.syncSourcesJson !== undefined ? { syncSourcesJson: val.syncSourcesJson } : {}),
  });
  internalRevalidate();
  return { success: true };
}

export async function fetchDiscoveredReposAction() {
  await requireAdmin();
  const repos = await getDiscoveredGithubRepos();
  return { success: true, repos };
}

// 10. Backup Import & Validation
export async function importBackupAction(rawJson: unknown): Promise<ImportBackupResult> {
  await requireAdmin();

  let parsedJson = rawJson;
  if (typeof rawJson === "string") {
    try {
      parsedJson = JSON.parse(rawJson);
    } catch {
      return {
        success: false,
        message: "Invalid JSON format. Could not parse uploaded file.",
        errors: ["Syntax error in JSON string"],
      };
    }
  }

  const validation = BackupDataSchema.safeParse(parsedJson);
  if (!validation.success) {
    const errors = validation.error.issues.map(
      (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`
    );
    return {
      success: false,
      message: "Backup validation failed. The JSON does not match the required schema.",
      errors: errors.slice(0, 10),
    };
  }

  const {
    profile: prof,
    categories: cats,
    projects: projs,
    achievements: achs,
    experiences: exps,
    education: edus,
    systemSettings: sysSettings,
  } = validation.data;

  // 1. Update Profile
  let profileUpdated = false;
  if (prof) {
    await db
      .update(profile)
      .set({
        name: prof.name,
        title: prof.title,
        bio: prof.bio,
        shortBio: prof.shortBio || "",
        avatarUrl: prof.avatarUrl || "",
        statusText: prof.statusText || "",
        email: prof.email || "",
        phone: prof.phone || "",
        location: prof.location || "",
        resumeUrl: prof.resumeUrl || "",
        githubUrl: prof.githubUrl || "",
        linkedinUrl: prof.linkedinUrl || "",
        twitterUrl: prof.twitterUrl || "",
        telegramUrl: prof.telegramUrl || "",
        hobbies: prof.hobbies || "",
        languages: prof.languages || "",
        resumeProjectLimit: prof.resumeProjectLimit ?? 2,
        yearsOfExperience: prof.yearsOfExperience ?? 3,
        skillsJson: prof.skillsJson || "[]",
        metaTitle: prof.metaTitle || "",
        metaDescription: prof.metaDescription || "",
        metaKeywords: prof.metaKeywords || "",
        faviconUrl: prof.faviconUrl || "",
        ogImageUrl: prof.ogImageUrl || "",
        updatedAt: Date.now(),
      })
      .where(eq(profile.id, "default"));
    profileUpdated = true;
  }

  // 2. Categories
  if (Array.isArray(cats) && cats.length > 0) {
    await db.delete(categories);
    for (const cat of cats) {
      await db.insert(categories).values({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        orderIndex: cat.orderIndex ?? 0,
      });
    }
  }

  // 3. Projects
  if (Array.isArray(projs) && projs.length > 0) {
    await db.delete(projects);
    for (const proj of projs) {
      await db.insert(projects).values({
        id: proj.id,
        title: proj.title,
        slug: proj.slug,
        description: proj.description,
        fullDescription: proj.fullDescription || "",
        categoryId: proj.categoryId || null,
        categoryIdsJson: proj.categoryIdsJson || "[]",
        repoUrl: proj.repoUrl || "",
        liveUrl: proj.liveUrl || "",
        techStackJson: proj.techStackJson || "[]",
        mediaJson: proj.mediaJson || "[]",
        role: proj.role || "Creator",
        teamSize: proj.teamSize || "",
        period: proj.period || "",
        contributions: proj.contributions || "",
        isSelected: Boolean(proj.isSelected),
        stars: proj.stars ?? 0,
        forks: proj.forks ?? 0,
        language: proj.language || "TypeScript",
        isFeatured: Boolean(proj.isFeatured),
        orderIndex: proj.orderIndex ?? 0,
        createdAt: proj.createdAt ?? Date.now(),
      });
    }
  }

  // 4. Achievements
  if (Array.isArray(achs) && achs.length > 0) {
    await db.delete(achievements);
    for (const ach of achs) {
      await db.insert(achievements).values({
        id: ach.id,
        title: ach.title,
        issuer: ach.issuer,
        date: ach.date,
        description: ach.description || "",
        category: ach.category || "Award",
        proofUrl: ach.proofUrl || "",
        mediaJson: ach.mediaJson || "[]",
        orderIndex: ach.orderIndex ?? 0,
        createdAt: ach.createdAt ?? Date.now(),
      });
    }
  }

  // 5. Experiences
  if (Array.isArray(exps) && exps.length > 0) {
    await db.delete(experiences);
    for (const exp of exps) {
      await db.insert(experiences).values({
        id: exp.id,
        role: exp.role,
        company: exp.company,
        companyUrl: exp.companyUrl || "",
        location: exp.location || "",
        period: exp.period,
        description: exp.description,
        mediaJson: exp.mediaJson || "[]",
        orderIndex: exp.orderIndex ?? 0,
        isCurrent: Boolean(exp.isCurrent),
      });
    }
  }

  // 6. Education
  if (Array.isArray(edus) && edus.length > 0) {
    await db.delete(education);
    for (const edu of edus) {
      await db.insert(education).values({
        id: edu.id,
        degree: edu.degree,
        field: edu.field,
        school: edu.school,
        period: edu.period,
        location: edu.location || "",
        courses: edu.courses || "",
        gpa: edu.gpa || "",
        orderIndex: edu.orderIndex ?? 0,
        createdAt: edu.createdAt ?? Date.now(),
      });
    }
  }

  // 7. System Settings
  let settingsUpdated = false;
  if (sysSettings) {
    await updateSystemSettingsDb({
      autoSyncEnabled: Boolean(sysSettings.autoSyncEnabled),
      syncIntervalHours: sysSettings.syncIntervalHours ?? 24,
      excludedReposJson: sysSettings.excludedReposJson || "[]",
      syncSourcesJson: sysSettings.syncSourcesJson || "[]",
      lastSyncedAt: sysSettings.lastSyncedAt ?? null,
      lastSyncStatus: sysSettings.lastSyncStatus || "idle",
      lastSyncMessage: sysSettings.lastSyncMessage || "",
    });
    settingsUpdated = true;
  }

  internalRevalidate();

  return {
    success: true,
    message: "Backup imported and verified successfully!",
    counts: {
      categories: cats?.length ?? 0,
      projects: projs?.length ?? 0,
      achievements: achs?.length ?? 0,
      experiences: exps?.length ?? 0,
      education: edus?.length ?? 0,
      profileUpdated,
      settingsUpdated,
    },
  };
}
