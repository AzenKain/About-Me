import { db } from "@/lib/db";
import { projects, profile, systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { SyncSource, DiscoveredRepo } from "@/types";

export interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics?: string[];
  archived: boolean;
  fork: boolean;
  updated_at: string;
}

export function extractGithubUsername(urlOrHandle: string): string {
  let clean = urlOrHandle.trim();
  clean = clean.replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  clean = clean.replace(/\/.*$/, "");
  clean = clean.replace(/^@/, "");
  return clean.trim();
}

export function extractRepoOwnerAndName(urlOrPath: string): string {
  let clean = urlOrPath.trim();
  clean = clean.replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  clean = clean.replace(/\.git$/i, "");
  clean = clean.replace(/\/$/, "");
  return clean.trim();
}

function getGithubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "AboutMe-Portfolio-App",
  };
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchUserRepos(username: string): Promise<GitHubRepoResponse[]> {
  const cleanUsername = extractGithubUsername(username);
  if (!cleanUsername) {
    throw new Error("Invalid GitHub username or profile URL");
  }

  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?per_page=100&sort=updated`,
    {
      headers: getGithubHeaders(),
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`GitHub user "${cleanUsername}" not found.`);
    }
    if (res.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Set GITHUB_TOKEN in .env for 5,000 req/hr.");
    }
    throw new Error(`GitHub API error for user "${cleanUsername}": ${res.statusText}`);
  }

  const data: GitHubRepoResponse[] = await res.json();
  return data.filter((repo) => !repo.fork);
}

export async function fetchOrgRepos(orgName: string): Promise<GitHubRepoResponse[]> {
  const cleanOrg = extractGithubUsername(orgName);
  if (!cleanOrg) {
    throw new Error("Invalid GitHub organization or guild name");
  }

  const orgRes = await fetch(
    `https://api.github.com/orgs/${encodeURIComponent(cleanOrg)}/repos?per_page=100&sort=updated`,
    {
      headers: getGithubHeaders(),
      next: { revalidate: 0 },
    }
  );

  if (orgRes.ok) {
    const data: GitHubRepoResponse[] = await orgRes.json();
    return data.filter((repo) => !repo.fork);
  }

  if (orgRes.status === 404) {
    return fetchUserRepos(cleanOrg);
  }

  if (orgRes.status === 403) {
    throw new Error("GitHub API rate limit exceeded. Set GITHUB_TOKEN in .env for 5,000 req/hr.");
  }

  throw new Error(`GitHub API error for organization "${cleanOrg}": ${orgRes.statusText}`);
}

export async function fetchSingleRepo(ownerAndName: string): Promise<GitHubRepoResponse | null> {
  const clean = extractRepoOwnerAndName(ownerAndName);
  if (!clean || !clean.includes("/")) return null;

  const res = await fetch(`https://api.github.com/repos/${clean}`, {
    headers: getGithubHeaders(),
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;
  return (await res.json()) as GitHubRepoResponse;
}

export interface FetchedRepoWithSource {
  repo: GitHubRepoResponse;
  sourceType: "primary" | "org" | "user" | "repo";
  sourceName: string;
}

export async function fetchAllConfiguredRepos(
  primaryUsername: string,
  syncSources: SyncSource[]
): Promise<FetchedRepoWithSource[]> {
  const results: FetchedRepoWithSource[] = [];
  const seenUrls = new Set<string>();

  // 1. Primary User Repositories
  try {
    const primaryRepos = await fetchUserRepos(primaryUsername);
    for (const r of primaryRepos) {
      const url = r.html_url.toLowerCase();
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        results.push({ repo: r, sourceType: "primary", sourceName: `@${primaryUsername}` });
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Sync] Primary user @${primaryUsername} fetch warning:`, msg);
  }

  // 2. Extra Sources (Guilds / Organizations / Users / Single Repos)
  for (const src of syncSources) {
    if (src.enabled === false) continue;
    const label = src.label || src.target;

    try {
      if (src.type === "org") {
        const orgRepos = await fetchOrgRepos(src.target);
        for (const r of orgRepos) {
          const url = r.html_url.toLowerCase();
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            results.push({ repo: r, sourceType: "org", sourceName: label });
          }
        }
      } else if (src.type === "user") {
        const userRepos = await fetchUserRepos(src.target);
        for (const r of userRepos) {
          const url = r.html_url.toLowerCase();
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            results.push({ repo: r, sourceType: "user", sourceName: label });
          }
        }
      } else if (src.type === "repo") {
        const single = await fetchSingleRepo(src.target);
        if (single) {
          const url = single.html_url.toLowerCase();
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            results.push({ repo: single, sourceType: "repo", sourceName: label });
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Sync] Source "${label}" (${src.type}) fetch warning:`, msg);
    }
  }

  return results;
}

export function buildExclusionSet(rawExclusions: string[]): Set<string> {
  return new Set(
    rawExclusions.map((r) =>
      r
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
        .replace(/\.git$/i, "")
        .replace(/\/$/, "")
    )
  );
}

export function isRepoExcluded(
  repo: { name: string; full_name?: string; html_url: string },
  excludedSet: Set<string>
): boolean {
  const repoName = (repo.name || "").toLowerCase();
  const repoFullName = (repo.full_name || "").toLowerCase();
  const repoSlug = repoName.replace(/[^a-z0-9]+/g, "-");
  const repoPath = repo.html_url.replace(/^https?:\/\/(www\.)?github\.com\//i, "").toLowerCase();

  return (
    excludedSet.has(repoName) ||
    excludedSet.has(repoFullName) ||
    excludedSet.has(repoSlug) ||
    excludedSet.has(repoPath) ||
    Array.from(excludedSet).some((exc) => exc.length > 0 && repoPath.endsWith(`/${exc}`))
  );
}

export async function getDiscoveredGithubRepos(): Promise<DiscoveredRepo[]> {
  const prof = await db.select().from(profile).where(eq(profile.id, "default")).limit(1);
  const username = prof[0]?.githubUrl ? extractGithubUsername(prof[0].githubUrl) : "";

  const [sys] = await db.select().from(systemSettings).where(eq(systemSettings.id, "default")).limit(1);
  let rawExcluded: string[] = [];
  let syncSources: SyncSource[] = [];

  try {
    if (sys?.excludedReposJson) {
      const parsed = JSON.parse(sys.excludedReposJson);
      if (Array.isArray(parsed)) rawExcluded = parsed.map(String).filter(Boolean);
    }
  } catch {}

  try {
    if (sys?.syncSourcesJson) {
      const parsed = JSON.parse(sys.syncSourcesJson);
      if (Array.isArray(parsed)) syncSources = parsed;
    }
  } catch {}

  const excludedSet = buildExclusionSet(rawExcluded);
  const fetched = await fetchAllConfiguredRepos(username, syncSources);

  return fetched.map(({ repo, sourceType, sourceName }) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    description: repo.description,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    isExcluded: isRepoExcluded(repo, excludedSet),
    sourceType,
    sourceName,
  }));
}

export async function syncAllGithubRepos(targetUsername?: string, explicitExcludedRepos?: string[]) {
  let username = targetUsername?.trim();

  // If no username passed, look up from profile
  if (!username) {
    const prof = await db.select().from(profile).where(eq(profile.id, "default")).limit(1);
    if (prof[0]?.githubUrl) {
      username = extractGithubUsername(prof[0].githubUrl);
    }
  }

  if (!username) {
    throw new Error("No GitHub username provided or configured in profile.");
  }

  // Load excluded repositories & sync sources from systemSettings
  const [sys] = await db.select().from(systemSettings).where(eq(systemSettings.id, "default")).limit(1);

  let rawExcluded: string[] = explicitExcludedRepos || [];
  if (!explicitExcludedRepos && sys?.excludedReposJson) {
    try {
      const parsed = JSON.parse(sys.excludedReposJson);
      if (Array.isArray(parsed)) {
        rawExcluded = parsed.map((item: unknown) => String(item).trim()).filter(Boolean);
      }
    } catch {}
  }

  let syncSources: SyncSource[] = [];
  if (sys?.syncSourcesJson) {
    try {
      const parsed = JSON.parse(sys.syncSourcesJson);
      if (Array.isArray(parsed)) {
        syncSources = parsed;
      }
    } catch {}
  }

  const excludedSet = buildExclusionSet(rawExcluded);
  const fetchedReposWithSource = await fetchAllConfiguredRepos(username, syncSources);
  const existingProjects = await db.select().from(projects);

  let updatedCount = 0;
  let insertedCount = 0;
  let skippedCount = 0;
  let totalStars = 0;
  let totalForks = 0;

  for (const { repo } of fetchedReposWithSource) {
    if (isRepoExcluded(repo, excludedSet)) {
      skippedCount++;
      continue;
    }

    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;

    const repoNormalized = repo.html_url.toLowerCase();
    const slug = repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const match = existingProjects.find(
      (p) =>
        (p.repoUrl && p.repoUrl.toLowerCase() === repoNormalized) ||
        p.slug.toLowerCase() === slug
    );

    const topicsArray = Array.isArray(repo.topics) && repo.topics.length > 0 ? repo.topics : [];
    if (repo.language && !topicsArray.includes(repo.language)) {
      topicsArray.unshift(repo.language);
    }

    if (match) {
      await db
        .update(projects)
        .set({
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language || match.language || "TypeScript",
          description: repo.description || match.description || "No description provided.",
          techStackJson:
            match.techStackJson && match.techStackJson !== "[]"
              ? match.techStackJson
              : JSON.stringify(topicsArray),
          liveUrl: repo.homepage || match.liveUrl || "",
        })
        .where(eq(projects.id, match.id));
      updatedCount++;
    } else {
      const id = `proj-${crypto.randomBytes(6).toString("hex")}`;
      await db.insert(projects).values({
        id,
        title: repo.name,
        slug,
        description: repo.description || "Open source project on GitHub.",
        fullDescription: repo.description || "",
        categoryId: null,
        repoUrl: repo.html_url,
        liveUrl: repo.homepage || "",
        techStackJson: JSON.stringify(topicsArray),
        mediaJson: "[]",
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language || "TypeScript",
        teamSize: "",
        isFeatured: repo.stargazers_count > 5,
        orderIndex: 0,
        createdAt: Date.now(),
      });
      insertedCount++;
    }
  }

  const activeSourcesCount = 1 + syncSources.filter((s) => s.enabled !== false).length;

  return {
    success: true,
    username,
    totalFetched: fetchedReposWithSource.length,
    updatedCount,
    insertedCount,
    skippedCount,
    excludedCount: rawExcluded.length,
    sourcesCount: activeSourcesCount,
    totalStars,
    totalForks,
    timestamp: Date.now(),
  };
}

export async function clearAllProjects() {
  await db.delete(projects);
  return { success: true };
}
