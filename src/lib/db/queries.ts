import { db } from "./index";
import {
  profile,
  categories,
  projects,
  achievements,
  experiences,
  education,
  systemSettings,
  Category,
  Project,
  Achievement,
  Experience,
  Education,
  Profile,
  SystemSettings,
} from "./schema";
import { asc, desc, eq } from "drizzle-orm";
import { ensureDbInitialized } from "./init";

export interface PortfolioData {
  profile: Profile | null;
  categories: Category[];
  projects: Project[];
  achievements: Achievement[];
  experiences: Experience[];
  education: Education[];
  systemSettings: SystemSettings;
}

let cachedPortfolioData: PortfolioData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 1000; // 10-second memory cache to absorb DDOS/traffic surges

export function invalidatePortfolioCache() {
  cachedPortfolioData = null;
  cacheTimestamp = 0;
}

export async function getPortfolioData(bypassCache = false): Promise<PortfolioData> {
  const now = Date.now();
  if (!bypassCache && cachedPortfolioData && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPortfolioData;
  }

  await ensureDbInitialized();

  const [profileData] = await db.select().from(profile).where(eq(profile.id, "default")).limit(1);
  const categoriesData = await db.select().from(categories).orderBy(asc(categories.orderIndex));
  const projectsData = await db.select().from(projects).orderBy(asc(projects.orderIndex), desc(projects.createdAt));
  const achievementsData = await db.select().from(achievements).orderBy(asc(achievements.orderIndex), desc(achievements.createdAt));
  const experiencesData = await db.select().from(experiences).orderBy(asc(experiences.orderIndex));
  const educationData = await db.select().from(education).orderBy(asc(education.orderIndex));
  const [settingsData] = await db.select().from(systemSettings).where(eq(systemSettings.id, "default")).limit(1);

  const fallbackSettings: SystemSettings = {
    id: "default",
    autoSyncEnabled: true,
    syncIntervalHours: 24,
    excludedReposJson: "[]",
    syncSourcesJson: "[]",
    lastSyncedAt: null,
    lastSyncStatus: "idle",
    lastSyncMessage: "",
    updatedAt: Date.now(),
  };

  const result: PortfolioData = {
    profile: profileData ?? null,
    categories: categoriesData,
    projects: projectsData,
    achievements: achievementsData,
    experiences: experiencesData,
    education: educationData,
    systemSettings: settingsData ?? fallbackSettings,
  };

  cachedPortfolioData = result;
  cacheTimestamp = now;

  return result;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  await ensureDbInitialized();
  const [data] = await db.select().from(systemSettings).where(eq(systemSettings.id, "default")).limit(1);
  if (data) return data;
  return {
    id: "default",
    autoSyncEnabled: true,
    syncIntervalHours: 24,
    excludedReposJson: "[]",
    syncSourcesJson: "[]",
    lastSyncedAt: null,
    lastSyncStatus: "idle",
    lastSyncMessage: "",
    updatedAt: Date.now(),
  };
}

export async function updateSystemSettingsDb(params: Partial<Omit<SystemSettings, "id">>) {
  await ensureDbInitialized();
  await db
    .update(systemSettings)
    .set({
      ...params,
      updatedAt: Date.now(),
    })
    .where(eq(systemSettings.id, "default"));
  invalidatePortfolioCache();
}

export async function getProfile(): Promise<Profile | null> {
  await ensureDbInitialized();
  const [data] = await db.select().from(profile).where(eq(profile.id, "default")).limit(1);
  return data ?? null;
}

export async function getCategories(): Promise<Category[]> {
  await ensureDbInitialized();
  return db.select().from(categories).orderBy(asc(categories.orderIndex));
}

export async function getProjects(): Promise<Project[]> {
  await ensureDbInitialized();
  return db.select().from(projects).orderBy(asc(projects.orderIndex), desc(projects.createdAt));
}

export async function getAchievements(): Promise<Achievement[]> {
  await ensureDbInitialized();
  return db.select().from(achievements).orderBy(asc(achievements.orderIndex), desc(achievements.createdAt));
}

export async function getExperiences(): Promise<Experience[]> {
  await ensureDbInitialized();
  return db.select().from(experiences).orderBy(asc(experiences.orderIndex));
}

export async function getEducation(): Promise<Education[]> {
  await ensureDbInitialized();
  return db.select().from(education).orderBy(asc(education.orderIndex));
}
