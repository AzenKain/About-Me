import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Repository URL or name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse owner/repo from URL or string like "owner/repo"
    const cleaned = url.replace(/https?:\/\/github\.com\//, "").replace(/\/$/, "");
    const parts = cleaned.split("/");
    if (parts.length < 2) {
      return new Response(JSON.stringify({ error: "Invalid repository format. Use 'owner/repo' or GitHub URL." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [owner, repo] = parts;
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        "User-Agent": "AboutMe-App",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}),
      },
    });

    if (!ghRes.ok) {
      return new Response(JSON.stringify({ error: `GitHub API error: ${ghRes.statusText}` }), {
        status: ghRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await ghRes.json();

    return new Response(
      JSON.stringify({
        title: data.name,
        description: data.description || "",
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language || "TypeScript",
        repoUrl: data.html_url,
        liveUrl: data.homepage || "",
        topics: data.topics || [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch repository";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
