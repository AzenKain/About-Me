import { client, db } from "./index";
import { profile, categories, projects, achievements, experiences, education } from "./schema";

let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await client.execute("PRAGMA journal_mode = WAL;");
      await client.execute("PRAGMA busy_timeout = 5000;");
      await client.execute("PRAGMA synchronous = NORMAL;");
    } catch {}

    await client.execute(`
      CREATE TABLE IF NOT EXISTS profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        bio TEXT NOT NULL,
        short_bio TEXT,
        avatar_url TEXT,
        status_text TEXT DEFAULT 'Available for new opportunities',
        email TEXT,
        phone TEXT DEFAULT '',
        location TEXT,
        resume_url TEXT,
        github_url TEXT,
        linkedin_url TEXT,
        twitter_url TEXT,
        telegram_url TEXT,
        hobbies TEXT DEFAULT '',
        languages TEXT DEFAULT '',
        resume_project_limit INTEGER DEFAULT 2,
        years_of_experience INTEGER DEFAULT 3,
        skills_json TEXT DEFAULT '[]',
        meta_title TEXT DEFAULT '',
        meta_description TEXT DEFAULT '',
        meta_keywords TEXT DEFAULT '',
        favicon_url TEXT DEFAULT '',
        og_image_url TEXT DEFAULT '',
        updated_at INTEGER
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        order_index INTEGER DEFAULT 0
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        full_description TEXT,
        category_id TEXT,
        category_ids_json TEXT DEFAULT '[]',
        repo_url TEXT,
        live_url TEXT,
        tech_stack_json TEXT DEFAULT '[]',
        media_json TEXT DEFAULT '[]',
        role TEXT DEFAULT 'Creator',
        team_size TEXT DEFAULT '',
        period TEXT DEFAULT '',
        contributions TEXT DEFAULT '',
        is_selected INTEGER DEFAULT 0,
        stars INTEGER DEFAULT 0,
        forks INTEGER DEFAULT 0,
        language TEXT,
        is_featured INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at INTEGER
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        issuer TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'Award',
        proof_url TEXT,
        media_json TEXT DEFAULT '[]',
        order_index INTEGER DEFAULT 0,
        created_at INTEGER
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS experiences (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        company TEXT NOT NULL,
        company_url TEXT,
        location TEXT,
        period TEXT NOT NULL,
        description TEXT NOT NULL,
        media_json TEXT DEFAULT '[]',
        order_index INTEGER DEFAULT 0,
        is_current INTEGER DEFAULT 0
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        github_username TEXT NOT NULL UNIQUE,
        created_at INTEGER
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS education (
        id TEXT PRIMARY KEY,
        degree TEXT NOT NULL,
        field TEXT NOT NULL,
        school TEXT NOT NULL,
        period TEXT NOT NULL,
        location TEXT,
        courses TEXT,
        gpa TEXT,
        order_index INTEGER DEFAULT 0,
        created_at INTEGER
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY,
        auto_sync_enabled INTEGER DEFAULT 1,
        sync_interval_hours INTEGER DEFAULT 24,
        excluded_repos_json TEXT DEFAULT '[]',
        sync_sources_json TEXT DEFAULT '[]',
        last_synced_at INTEGER,
        last_sync_status TEXT DEFAULT 'idle',
        last_sync_message TEXT DEFAULT '',
        updated_at INTEGER
      );
    `);

    try {
      await client.execute(`
        INSERT OR IGNORE INTO system_settings (id, auto_sync_enabled, sync_interval_hours, excluded_repos_json, sync_sources_json, last_sync_status, last_sync_message, updated_at)
        VALUES ('default', 1, 24, '[]', '[]', 'idle', 'Initialized default scheduler settings', strftime('%s', 'now') * 1000);
      `);
    } catch {}

    // Safe migrations for existing SQLite databases (ensures all columns exist)
    try {
      await client.execute("ALTER TABLE profile ADD COLUMN phone TEXT DEFAULT '';");
    } catch {}
    try {
      await client.execute("ALTER TABLE profile ADD COLUMN hobbies TEXT DEFAULT '';");
    } catch {}
    try {
      await client.execute("ALTER TABLE profile ADD COLUMN languages TEXT DEFAULT '';");
    } catch {}
    try {
      await client.execute("ALTER TABLE profile ADD COLUMN resume_project_limit INTEGER DEFAULT 2;");
    } catch {}
    try {
      await client.execute("ALTER TABLE profile ADD COLUMN years_of_experience INTEGER DEFAULT 3;");
    } catch {}
    try {
      await client.execute("ALTER TABLE profile ADD COLUMN meta_title TEXT DEFAULT '';");
    } catch {}
    try {
      await client.execute("ALTER TABLE profile ADD COLUMN meta_description TEXT DEFAULT '';");
    } catch {}
    try {
      await client.execute("ALTER TABLE profile ADD COLUMN meta_keywords TEXT DEFAULT '';");
    } catch {}
    try {
      await client.execute("ALTER TABLE profile ADD COLUMN favicon_url TEXT DEFAULT '';");
    } catch {}
    try {
      await client.execute("ALTER TABLE profile ADD COLUMN og_image_url TEXT DEFAULT '';");
    } catch {}
    try {
      await client.execute("ALTER TABLE projects ADD COLUMN category_ids_json TEXT DEFAULT '[]';");
    } catch {}
    try {
      await client.execute("ALTER TABLE projects ADD COLUMN media_json TEXT DEFAULT '[]';");
    } catch {}
    try {
      await client.execute("ALTER TABLE projects ADD COLUMN role TEXT DEFAULT 'Creator';");
    } catch {}
    try {
      await client.execute("ALTER TABLE projects ADD COLUMN team_size TEXT DEFAULT '';");
    } catch {}
    try {
      await client.execute("ALTER TABLE projects ADD COLUMN period TEXT DEFAULT '';");
    } catch {}
    try {
      await client.execute("ALTER TABLE projects ADD COLUMN contributions TEXT DEFAULT '';");
    } catch {}
    try {
      await client.execute("ALTER TABLE projects ADD COLUMN is_selected INTEGER DEFAULT 0;");
    } catch {}
    try {
      await client.execute("ALTER TABLE achievements ADD COLUMN media_json TEXT DEFAULT '[]';");
    } catch {}
    try {
      await client.execute("ALTER TABLE experiences ADD COLUMN media_json TEXT DEFAULT '[]';");
    } catch {}
    try {
      await client.execute("ALTER TABLE experiences ADD COLUMN is_current INTEGER DEFAULT 0;");
    } catch {}
    try {
      await client.execute("ALTER TABLE system_settings ADD COLUMN excluded_repos_json TEXT DEFAULT '[]';");
    } catch {}
    try {
      await client.execute("ALTER TABLE system_settings ADD COLUMN sync_sources_json TEXT DEFAULT '[]';");
    } catch {}
    try {
      await client.execute("ALTER TABLE system_settings ADD COLUMN last_sync_message TEXT DEFAULT '';");
    } catch {}

  const profileCountResult = await client.execute("SELECT COUNT(*) as count FROM profile;");
  const count = Number(profileCountResult.rows[0]?.count ?? 0);

  if (count === 0) {
    await seedDefaultData();
  }

  const eduCountResult = await client.execute("SELECT COUNT(*) as count FROM education;");
  const eduCount = Number(eduCountResult.rows[0]?.count ?? 0);
  if (eduCount === 0) {
    await db.insert(education).values({
      id: "edu-1",
      degree: "B.S.",
      field: "Computer Science",
      school: "University of Washington",
      period: "September 2020 - Current",
      location: "Seattle, WA",
      courses:
        "Computer Science I and II\nDiscrete Mathematics\nData Structures and Algorithms\nComputer Organization and Architecture\nOperating Systems",
      gpa: "3.8/4.0",
      orderIndex: 1,
      createdAt: Date.now(),
    });
  }
  })();

  return initPromise;
}

export async function seedDefaultData() {
  const now = Date.now();

  const initialSkills = [
    {
      category: "Languages & Core",
      items: ["TypeScript", "JavaScript", "Go", "Rust", "Python", "SQL", "HTML/CSS"],
    },
    {
      category: "Frontend & Architecture",
      items: ["Next.js (App Router)", "React 19", "Tailwind CSS v4", "Zustand", "Performance Optimization"],
    },
    {
      category: "Backend & Systems",
      items: ["Node.js", "Bun", "Express", "FastAPI", "gRPC", "PostgreSQL", "SQLite/LibSQL", "Redis"],
    },
    {
      category: "DevOps & Infrastructure",
      items: ["Docker", "Kubernetes", "Linux VPS", "Nginx", "CI/CD (GitHub Actions)", "OAuth2/OIDC", "Security Hardening"],
    },
  ];

  await db.insert(profile).values({
    id: "default",
    name: "Alex Rivera",
    title: "Full-Stack Software Engineer",
    shortBio: "Full-Stack Software Engineer specializing in backend systems, distributed architectures, and modern web applications.",
    bio: "Full-Stack Software Engineer with a passion for designing resilient backend architectures, low-latency microservices, and interactive web experiences.",
    avatarUrl: "https://avatars.githubusercontent.com/u/9919?v=4",
    statusText: "Available for new opportunities",
    email: "contact@example.com",
    location: "San Francisco, CA",
    resumeUrl: "/resume",
    githubUrl: "https://github.com/example",
    linkedinUrl: "https://linkedin.com/in/example",
    twitterUrl: "",
    telegramUrl: "",
    skillsJson: JSON.stringify(initialSkills),
    updatedAt: now,
  });

  const cats = [
    { id: "cat-ai", name: "AI & ML", slug: "ai-ml", orderIndex: 1 },
    { id: "cat-web", name: "Web Systems", slug: "web-systems", orderIndex: 2 },
    { id: "cat-tools", name: "CLI & Tooling", slug: "cli-tools", orderIndex: 3 },
    { id: "cat-infra", name: "Infrastructure", slug: "cloud-infra", orderIndex: 4 },
  ];

  for (const c of cats) {
    await db.insert(categories).values(c);
  }

  const initialProjects = [
    {
      id: "proj-1",
      title: "omni-agent: Multi-Modal Agent Runtime",
      slug: "omni-agent",
      description: "Distributed execution engine for AI agents with sandboxed code execution, memory graphs, and low-latency streaming.",
      fullDescription: "Built with TypeScript and Bun. Low-latency streaming responses, WebSocket duplexing, and granular permission enforcement.",
      categoryId: "cat-ai",
      repoUrl: "https://github.com/example/omni-agent",
      liveUrl: "https://omniagent.demo.app",
      techStackJson: JSON.stringify(["TypeScript", "Bun", "Rust", "Vector DB", "Docker"]),
      stars: 482,
      forks: 64,
      language: "TypeScript",
      isFeatured: true,
      orderIndex: 1,
      createdAt: now - 30 * 86400000,
    },
    {
      id: "proj-2",
      title: "edge-kv: Embedded Key-Value Storage Engine",
      slug: "edge-kv",
      description: "Lightweight distributed key-value store in Go with Raft consensus, sub-millisecond read latency, and CRDT replication.",
      fullDescription: "High-throughput embedded database with gRPC and REST APIs for multi-node setups.",
      categoryId: "cat-infra",
      repoUrl: "https://github.com/example/edge-kv",
      liveUrl: "https://edgekv.dev",
      techStackJson: JSON.stringify(["Go", "Raft", "gRPC", "Redis Protocol"]),
      stars: 1250,
      forks: 148,
      language: "Go",
      isFeatured: true,
      orderIndex: 2,
      createdAt: now - 60 * 86400000,
    },
    {
      id: "proj-3",
      title: "srtools: Polyglot Monorepo Task Orchestrator",
      slug: "srtools",
      description: "Fast build orchestrator and dependency graph resolver for monorepos with cryptographic remote caching.",
      fullDescription: "Written in Rust. Reduces CI/CD pipeline runtimes by up to 70% with intelligent caching.",
      categoryId: "cat-tools",
      repoUrl: "https://github.com/example/srtools",
      liveUrl: "https://srtools.dev",
      techStackJson: JSON.stringify(["Rust", "Tokio", "Rayon", "SHA-256"]),
      stars: 890,
      forks: 92,
      language: "Rust",
      isFeatured: true,
      orderIndex: 3,
      createdAt: now - 90 * 86400000,
    },
    {
      id: "proj-4",
      title: "shield-gate: Zero-Trust Reverse Security Proxy",
      slug: "shield-gate",
      description: "Edge security proxy with sliding-window token rate limiting, JWT token validation, and anti-abuse heuristics.",
      fullDescription: "High-performance edge reverse proxy built with Next.js and Cloudflare Workers.",
      categoryId: "cat-web",
      repoUrl: "https://github.com/example/shield-gate",
      liveUrl: "https://shieldgate.io",
      techStackJson: JSON.stringify(["TypeScript", "Bun", "Jose", "SQLite"]),
      stars: 640,
      forks: 53,
      language: "TypeScript",
      isFeatured: false,
      orderIndex: 4,
      createdAt: now - 120 * 86400000,
    },
  ];

  for (const p of initialProjects) {
    await db.insert(projects).values(p);
  }

  const initialAchievements = [
    {
      id: "ach-1",
      title: "First Prize (Champion) - National AI & Cloud Hackathon",
      issuer: "Ministry of Science & Technology & AWS",
      date: "Nov 2024",
      description: "Designed and implemented an edge routing algorithm outperforming 120+ teams nationwide.",
      category: "Hackathon",
      proofUrl: "https://example.com/awards/ai-hackathon-2024",
      orderIndex: 1,
      createdAt: now,
    },
    {
      id: "ach-2",
      title: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services (AWS)",
      date: "Aug 2024",
      description: "Validated advanced skills in designing distributed, resilient cloud architectures.",
      category: "Certification",
      proofUrl: "https://aws.amazon.com/verification",
      orderIndex: 2,
      createdAt: now,
    },
    {
      id: "ach-3",
      title: "Gold Medal - National Collegiate Programming Contest",
      issuer: "Vietnam Olympiad in Informatics",
      date: "2022",
      description: "Ranked 1st place in algorithmic problem solving among 80 participating university teams.",
      category: "Award",
      proofUrl: "https://example.com/awards/acm-icpc",
      orderIndex: 3,
      createdAt: now,
    },
  ];

  for (const a of initialAchievements) {
    await db.insert(achievements).values(a);
  }

  const initialExperiences = [
    {
      id: "exp-1",
      role: "Lead Full-Stack Architect",
      company: "Nexus Cloud Technologies",
      companyUrl: "https://example.com",
      location: "Ho Chi Minh City, Vietnam",
      period: "2023 - Present",
      description: "Architected microservices and high-throughput event ingestion pipelines handling 50M+ requests daily. Reduced p99 latency by 45%.",
      orderIndex: 1,
      isCurrent: true,
    },
    {
      id: "exp-2",
      role: "Senior Backend Engineer",
      company: "Vanguard Fintech Solutions",
      companyUrl: "https://example.com",
      location: "Singapore / Remote",
      period: "2021 - 2023",
      description: "Built PCI-DSS compliant financial ledgers in Go and Node.js with distributed locks and idempotent execution.",
      orderIndex: 2,
      isCurrent: false,
    },
    {
      id: "exp-3",
      role: "Software Engineer",
      company: "CyberMatrix Labs",
      companyUrl: "https://example.com",
      location: "Da Nang, Vietnam",
      period: "2019 - 2021",
      description: "Developed real-time monitoring dashboards and intrusion detection tools using React, WebSockets, and Python.",
      orderIndex: 3,
      isCurrent: false,
    },
  ];

  for (const e of initialExperiences) {
    await db.insert(experiences).values(e);
  }
}
