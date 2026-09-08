# AboutMe — Executive Developer Portfolio and ATS Resume CMS

A high-performance, hardened personal portfolio and executive resume system with an integrated zero-trust Admin CMS. Built for **Self-Hosting on VPS or Docker** using **Local SQLite** — 100% independent with zero external cloud database subscriptions.

---

## Key Highlights

- **Aesthetic**: Minimalist Bento Grid design inspired by Linear and Vercel dark interfaces, styled with [Tailwind CSS v4](https://tailwindcss.com).
- **Executive Resume Engine**:
  - Pixel-perfect **Harvard-style 1-page A4 ATS layout**.
  - Selective monochrome inline bolding (**metrics** and **core technologies**) designed for 6–8 second recruiter scans.
  - High-resolution client-side canvas renderer for instant PDF / JPG downloads and clipboard copying.
- **Admin CMS (`/admin`)**:
  - Live editing of Bio, Projects, Work Experiences, Education, Honors, and Categorized Skills.
  - Rich Markdown toolbar with instant Live Preview (Bold, Italic, Headings, Bullets, Code).
  - **Multi-Source GitHub Sync Engine**: Aggregate repositories across personal accounts, developer guilds, organizations, and single repos.
  - **Interactive Repository Discovery & Exclusion Picker**: Auto-fetches all repositories directly from GitHub API with an interactive checklist, search filter, and batch exclude/include controls (no manual URL typing).
  - Media and credential attachment manager (screenshots, architecture diagrams, YouTube/Vimeo demos).
  - Full-fidelity Zod-validated JSON backup and atomic restore.
- **Security First**:
  - **Scrypt Password Hashing with Salt**: Zero plaintext passwords in `.env`.
  - **Whitelisted GitHub OAuth 2.0**: One-click login restricted to your GitHub username.
  - **Brute-Force Shield**: IP sliding-window rate limiting and global circuit breakers.
  - **Encrypted Sessions**: Tamper-proof AES-256 JWT cookies (`HTTPOnly`, `SameSite=Strict`, `Secure`).
  - **Hardened HTTP Headers**: Strict CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
- **Local-First SQLite Architecture**:
  - SQLite with **WAL mode** (`data/portfolio.db`) and concurrent connection pooling.
  - In-memory TTL caching with immediate on-demand cache revalidation (`revalidatePath`).

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime & PM** | [Bun](https://bun.sh) (v1.2+) |
| **Framework** | [Next.js 16 (App Router + Turbopack)](https://nextjs.org) and [React 19](https://react.dev) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) and [Lucide Icons](https://lucide.dev) |
| **Database & ORM** | [SQLite](https://sqlite.org) (WAL mode) + [Drizzle ORM](https://orm.drizzle.team) |
| **Authentication** | Scrypt Hashing + GitHub OAuth2 + Jose (JWT) |
| **Deployment** | Docker, Docker Compose, Linux VPS (Systemd and Nginx) |

---

## Environment Configuration (`.env`)

Create your `.env` file from the provided template:

```bash
cp .env.example .env
```

### Environment Variables Breakdown

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | No | Port the server listens on (default: `3000`). | `3000` |
| `HOSTNAME` | No | Host bind address (default: `0.0.0.0`). | `0.0.0.0` |
| `DATABASE_URL` | **Yes** | Path to the SQLite database file on disk. | `file:data/portfolio.db` |
| `ADMIN_PASSKEY_HASH` | **Yes\*** | Scrypt hash of your admin password (with salt). | Generated via `bun run hash-passkey` |
| `ADMIN_PASSKEY` | No | Plaintext fallback (not recommended for production). | `your_secret_password` |
| `SESSION_SECRET` | **Yes** | 32+ character random hex string used to encrypt JWT cookies. | `openssl rand -hex 32` |
| `ENABLE_INTERNAL_CRON` | No | Optional kill-switch to disable internal scheduler on VPS/Docker (default: `true`). | `false` |
| `CRON_SECRET` | No | Secret bearer token for Vercel Cron or external curl trigger (`/api/github/cron-sync`). | `my_cron_secret_token_123` |
| `GITHUB_TOKEN` | No | Personal Access Token to raise GitHub API limit to 5,000 req/hr. | `ghp_xxxxxxxxxxxx` |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth2 Client ID for one-click admin login. | `Ov23lixxxxxxxxxx` |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth2 Client Secret. | `xxxxxxxxxxxxxxxxxxxx` |
| `ADMIN_GITHUB_USERNAME` | Optional | Your GitHub username (enforces whitelist access). | `AzenKain` |

> **Generating Credentials:**
>
> 1. **Generate `SESSION_SECRET`**:
>
>    ```bash
>    openssl rand -hex 32
>    ```
>
> 2. **Generate `ADMIN_PASSKEY_HASH`**:
>
>    ```bash
>    bun run hash-passkey "YourStrongPasswordHere!@#"
>    ```
>
>    Copy the generated `ADMIN_PASSKEY_HASH=...` output directly into `.env`.

---

## Quick Start (Local Development)

### 1. Prerequisites

- Install [Bun](https://bun.sh):

  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### 2. Install and Setup

```bash
# Clone the repository
git clone https://github.com/AzenKain/AboutMe.git
cd AboutMe

# Setup environment
cp .env.example .env
# Edit .env with your desired secrets and settings

# Install dependencies
bun install

# Run database migration and initial seeding
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your portfolio.  
Access the Admin CMS at [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

---

## Deployment with Docker and Docker Compose (Recommended)

Docker provides an isolated, multi-stage production build running Next.js standalone mode on Alpine Linux.

### 1. Quick Deploy

```bash
# 1. Setup your .env file
cp .env.example .env
nano .env

# 2. Build and start container in the background
docker compose up -d --build
```

### 2. Data Persistence

The `docker-compose.yml` mounts the host `./data` directory into the container:

```yaml
volumes:
  - ./data:/app/data
```

This ensures your SQLite database (`portfolio.db`) and uploaded media persist across container restarts, rebuilds, and image upgrades.

### 3. Docker Management Commands

```bash
# View real-time logs
docker compose logs -f aboutme

# Check container status
docker compose ps

# Stop the container
docker compose down

# Rebuild and restart after pulling code updates
git pull
docker compose up -d --build
```

---

## Bare-Metal VPS Deployment (Systemd and Nginx)

If you prefer running directly on a Linux VPS without Docker:

### 1. Build Production Bundle

```bash
bun install --frozen-lockfile
bun run build
```

### 2. Configure Systemd Service

Create `/etc/systemd/system/aboutme.service`:

```ini
[Unit]
Description=AboutMe Portfolio and ATS Resume CMS
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/AboutMe
ExecStart=/root/.bun/bin/bun run start
Restart=always
RestartSec=5
EnvironmentFile=/var/www/AboutMe/.env

# Security Sandbox
ProtectSystem=full
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aboutme
sudo systemctl status aboutme
```

### 3. Configure Nginx Reverse Proxy with SSL

Create `/etc/nginx/sites-available/aboutme`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Maximum upload size for resume media attachments
    client_max_body_size 16M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable configuration and issue SSL certificate with Certbot:

```bash
sudo ln -s /etc/nginx/sites-available/aboutme /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtain free Let's Encrypt SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## GitHub OAuth 2.0 Setup (Optional)

To enable 1-click administrator sign-in via GitHub:

1. Open [GitHub Developer Settings](https://github.com/settings/developers) -> **OAuth Apps** -> **New OAuth App**.
2. Configure application details:
   - **Application Name**: `Portfolio Admin`
   - **Homepage URL**: `https://yourdomain.com` (or `http://localhost:3000` for testing)
   - **Authorization callback URL**: `https://yourdomain.com/api/auth/callback/github`
3. Click **Register application**.
4. Copy the **Client ID** and click **Generate a new client secret** to copy the secret.
5. Add to your `.env`:

   ```env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ADMIN_GITHUB_USERNAME=AzenKain
   ```

   *(Only the username specified in `ADMIN_GITHUB_USERNAME` is granted admin access).*

---

## Automated GitHub Sync (Vercel vs VPS / Docker)

The application features smart environment detection to handle automated, scheduled GitHub synchronization (stars, forks, tech stacks, and topics) across multiple sources with repository-level exclusion controls:

### 1. Docker / VPS / Standalone Node.js (Internal Cron)

When deployed on a persistent server (Docker or VPS), the app automatically detects that it is running in a persistent runtime:

- **Zero-configuration background scheduler:** The internal scheduler (`src/lib/cron/scheduler.ts`) is activated automatically via Next.js instrumentation (`src/instrumentation.ts`).
- **Configurable via Web Admin UI:** The sync interval (1h, 3h, 6h, 12h, 24h, 48h, 72h, weekly) and auto-sync toggle are saved directly into the SQLite `system_settings` table. You can adjust them anytime from the Admin CMS (`/admin` -> Security & Deploy tab) without editing `.env` or restarting the server.
- **Audit & Status tracking:** The database logs the timestamp, outcome status (Success/Failed), and summary message of the latest sync cycle.
- **Optional kill-switch:** Set `ENABLE_INTERNAL_CRON=false` in `.env` if you want to deactivate the background worker entirely.
- No Linux crontab, external curl, or separate cron daemon required.

### 2. Multi-Source Repository Aggregation (Guilds, Organizations, Accounts)

Beyond your primary personal GitHub profile, the sync engine supports multi-source aggregation:

- **Supported Source Types:**
  - `Guild / Organization`: Ingest all repositories belonging to a company, studio, or open-source guild.
  - `Additional Account`: Ingest repositories from a secondary or work GitHub profile.
  - `Single Repository`: Ingest a specific individual repository (`owner/repo` or full URL).
- **Smart GitHub Fallback:** Automatically tries the GitHub `/orgs/{name}/repos` endpoint first, seamlessly falling back to `/users/{name}/repos` if the organization was registered as a standard GitHub account.
- **Granular Toggles:** Each source can be individually enabled or disabled with a single click, or removed entirely without affecting other sources.
- **Persistent Storage:** Source configurations are stored in the `system_settings.sync_sources_json` column.

### 3. Interactive Repository Discovery & Exclusion Picker

The Admin CMS provides an interactive checklist interface under the **Security & Deploy** tab to select exactly which repositories should sync:

- **Auto-Discovery (No Manual URL Typing):** Automatically queries the GitHub API for all repositories across your personal profile and enabled sync sources.
- **Interactive Exclusion Controls:** Toggle any repository between `[Synced]` and `[Excluded]` using the 1-click `[Exclude from Sync]` / `[Include in Sync]` buttons or individual checkboxes.
- **Search & Filter Tabs:**
  - Quick filter pills: `All`, `[Synced]`, `[Excluded]`, `Personal`, and `Guilds/Orgs`.
  - Instant text filter: search by repo name, description, primary language, topics, or origin source.
- **Batch Operations:** Use `Exclude All Filtered` or `Include All Filtered` to exclude or re-include entire groups of repositories in one action.
- **Sync Engine Integration:** The background cron scheduler and the manual sync endpoint strictly honor all exclusions, preventing excluded repositories from being created or updated in the portfolio.

### 4. Vercel Deployment (Vercel Cron)

Because Vercel runs on ephemeral Serverless Functions that freeze or terminate after each request, persistent background timers are disabled automatically when `VERCEL=1` is detected:

- **Pre-configured `vercel.json`:** The repository includes a `vercel.json` scheduled to call `/api/github/cron-sync` daily at 00:00 UTC.
- **Setup on Vercel:**
  1. Go to your Vercel Project Dashboard -> **Settings** -> **Environment Variables**.
  2. Add `CRON_SECRET` with a secure random string (e.g. `openssl rand -hex 24`).
  3. Vercel Cron will automatically inject `Authorization: Bearer <CRON_SECRET>` when triggering the sync endpoint.
- **Identical Logic:** The Vercel cron route invokes the same multi-source aggregation and exclusion-filtering engine as the internal Docker scheduler.

---

## Backup and Data Protection

### Method 1: File Copy (Instant)

Since SQLite stores all data in a single local file, back up with a simple copy:

```bash
# Create a timestamped copy
cp data/portfolio.db "data/backup-$(date +%F).db"
```

### Method 2: Web Admin JSON Export and Restore (Zod Validated)

1. Log into the Admin CMS at `/admin`.
2. Navigate to the **Security and Deploy** tab.
3. **Export Backup:** Click **"Export JSON Backup"** to download a structured JSON dump of all profile, projects, experiences, education, categories, achievements, and system settings (including configured sync sources and exclusion rules).
4. **Import & Restore Backup:** Click **"Import JSON Backup"** and select any exported JSON file. The backend runs runtime validation against the Zod schema (`BackupDataSchema`). If valid, the database is restored atomically with all project relations and settings. If invalid, detailed field-level errors are reported and no corrupted data is written.

---

## Project Scripts Reference

| Command | Description |
| :--- | :--- |
| `bun run dev` | Starts Next.js development server with Turbopack on port 3000. |
| `bun run build` | Compiles the production build with type checking and page optimization. |
| `bun run start` | Runs the compiled production server. |
| `bun run lint` | Runs ESLint 9 checks across all source files. |
| `bun run hash-passkey "<pwd>"` | Generates a salt-hashed scrypt string for `ADMIN_PASSKEY_HASH`. |

---

## License

MIT License. Feel free to use, modify, and self-host your own portfolio and resume.
