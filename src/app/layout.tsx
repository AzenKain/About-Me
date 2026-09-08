import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { db } from "@/lib/db";
import { profile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#090a0f",
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [p] = await db
      .select()
      .from(profile)
      .where(eq(profile.id, "default"))
      .limit(1);

    const name = p?.name || "Developer Portfolio";
    const title = p?.metaTitle?.trim() || `${name} | Interactive Portfolio & Resume`;
    const description =
      p?.metaDescription?.trim() ||
      p?.shortBio?.trim() ||
      p?.bio?.trim() ||
      "High-performance developer portfolio and interactive resume highlighting Git repositories, hackathon awards, and engineering milestones.";
    const keywords = p?.metaKeywords?.trim()
      ? p.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean)
      : ["Portfolio", "Resume", "Developer", "Software Engineer", name];
    const favicon = p?.faviconUrl?.trim() || "/favicon.ico";
    const ogImage = p?.ogImageUrl?.trim() || "/og-image.png";

    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
      title,
      description,
      keywords,
      authors: [{ name }],
      creator: name,
      icons: {
        icon: [
          { url: favicon },
          { url: "/icon.png", sizes: "192x192", type: "image/png" },
        ],
        apple: [
          { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
        ],
        shortcut: [
          { url: favicon },
        ],
      },
      openGraph: {
        title,
        description,
        type: "website",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${name} Portfolio`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: "Developer Portfolio & Interactive Resume",
      description: "High-performance developer portfolio and interactive resume.",
      icons: {
        icon: [{ url: "/favicon.ico" }],
      },
    };
  }
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased selection:bg-sky-500 selection:text-white`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col overflow-x-hidden">
        {children}
        <Toaster richColors position="top-right" theme="dark" closeButton />
      </body>
    </html>
  );
}
