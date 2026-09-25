import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";

export type SiteWorkItem = { title: string; type: string; description: string };
export type SiteSocialLink = { label: string; href: string };
export type SiteSection =
  | { type: "about"; title: string; body: string; order?: number; visible?: boolean }
  | { type: "services"; title: string; items: string[]; order?: number; visible?: boolean }
  | { type: "work"; title: string; items: SiteWorkItem[]; order?: number; visible?: boolean }
  | { type: "approach"; title: string; items: string[]; order?: number; visible?: boolean }
  | { type: "cta"; label: string; order?: number; visible?: boolean };

export type PublicSiteContent = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  statement: string;
  accent: "cyan" | "orange" | "violet";
  mark: string;
  services: string[];
  stats: { label: string; value: string }[];
  featured: string;
  seo: { title: string; description: string; keywords: string[] };
  about: string;
  approach: string[];
  work: SiteWorkItem[];
  contactLabel: string;
  contact: { email: string; phone: string; label: string };
  location: { city: string; region: string; country: string; address: string };
  socialLinks: SiteSocialLink[];
  footer: { tagline: string; copyright: string };
  sections: SiteSection[];
};

export type EditableSiteContent = PublicSiteContent & { hasDraft: boolean; published: boolean; updatedAt: string };
export type SiteContentRevision = { action: "draft" | "publish" | "unpublish"; createdAt: string; id: number; slug: string };

type SiteRow = { slug: string; content_json: string; published: number };

export class SitesContentStore {
  private readonly database: DatabaseSync;

  constructor(filename: string) {
    if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true });
    this.database = new DatabaseSync(filename);
    this.database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
    this.database.exec(
      "CREATE TABLE IF NOT EXISTS sites_public_content (slug TEXT PRIMARY KEY, content_json TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)",
    );
    try { this.database.exec("ALTER TABLE sites_public_content ADD COLUMN draft_json TEXT"); } catch { /* Existing database already has the draft column. */ }
    this.database.exec(
      "CREATE INDEX IF NOT EXISTS idx_sites_public_content_published_slug ON sites_public_content (published, slug)",
    );
    this.database.exec("CREATE TABLE IF NOT EXISTS sites_content_revisions (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, action TEXT NOT NULL, content_json TEXT NOT NULL, created_at TEXT NOT NULL)");
    this.database.exec("PRAGMA optimize");
    this.seedDefaults();
  }

  listPublished(): PublicSiteContent[] {
    const rows = this.database
      .prepare("SELECT slug, content_json, published FROM sites_public_content WHERE published = 1 ORDER BY slug")
      .all() as unknown as SiteRow[];
    return rows.map((row) => this.parse(row));
  }

  findPublished(slug: string): PublicSiteContent | undefined {
    const row = this.database
      .prepare("SELECT slug, content_json, published FROM sites_public_content WHERE slug = ? AND published = 1")
      .get(slug) as unknown as SiteRow | undefined;
    return row ? this.parse(row) : undefined;
  }

  findEditable(slug: string): EditableSiteContent | undefined {
    const row = this.database.prepare("SELECT slug, content_json, draft_json, published, updated_at FROM sites_public_content WHERE slug = ?").get(slug) as { content_json: string; draft_json: string | null; published: number; slug: string; updated_at: string } | undefined;
    if (!row) return undefined;
    return { ...this.parse({ content_json: row.draft_json ?? row.content_json, published: row.published, slug: row.slug }), hasDraft: Boolean(row.draft_json), published: Boolean(row.published), updatedAt: row.updated_at };
  }

  saveDraft(slug: string, content: PublicSiteContent): EditableSiteContent | undefined {
    const createdAt = new Date().toISOString();
    const result = this.database.prepare("UPDATE sites_public_content SET draft_json = ?, updated_at = ? WHERE slug = ?").run(JSON.stringify(content), createdAt, slug);
    if (Number(result.changes)) this.recordRevision(slug, "draft", content, createdAt);
    return Number(result.changes) ? this.findEditable(slug) : undefined;
  }

  publish(slug: string): EditableSiteContent | undefined {
    const createdAt = new Date().toISOString();
    const current = this.findEditable(slug);
    this.database.prepare("UPDATE sites_public_content SET content_json = COALESCE(draft_json, content_json), draft_json = NULL, published = 1, updated_at = ? WHERE slug = ?").run(createdAt, slug);
    if (current) this.recordRevision(slug, "publish", current, createdAt);
    return this.findEditable(slug);
  }

  unpublish(slug: string): EditableSiteContent | undefined {
    const createdAt = new Date().toISOString();
    const current = this.findEditable(slug);
    this.database.prepare("UPDATE sites_public_content SET published = 0, updated_at = ? WHERE slug = ?").run(createdAt, slug);
    if (current) this.recordRevision(slug, "unpublish", current, createdAt);
    return this.findEditable(slug);
  }

  listRevisions(slug: string): SiteContentRevision[] {
    const rows = this.database.prepare("SELECT id, slug, action, created_at FROM sites_content_revisions WHERE slug = ? ORDER BY id DESC LIMIT 20").all(slug) as unknown as { action: SiteContentRevision["action"]; created_at: string; id: number; slug: string }[];
    return rows.map((row) => ({ action: row.action, createdAt: row.created_at, id: row.id, slug: row.slug }));
  }

  restoreRevision(slug: string, revisionId: number): EditableSiteContent | undefined {
    const row = this.database.prepare("SELECT content_json FROM sites_content_revisions WHERE id = ? AND slug = ?").get(revisionId, slug) as { content_json: string } | undefined;
    if (!row) return undefined;
    return this.saveDraft(slug, JSON.parse(row.content_json) as PublicSiteContent);
  }

  close(): void {
    this.database.close();
  }

  private parse(row: SiteRow): PublicSiteContent {
    return JSON.parse(row.content_json) as PublicSiteContent;
  }

  private recordRevision(slug: string, action: SiteContentRevision["action"], content: PublicSiteContent, createdAt: string): void {
    this.database.prepare("INSERT INTO sites_content_revisions (slug, action, content_json, created_at) VALUES (?, ?, ?, ?)").run(slug, action, JSON.stringify(content), createdAt);
  }

  private seedDefaults(): void {
    const insert = this.database.prepare(
      "INSERT INTO sites_public_content (slug, content_json, published, updated_at, draft_json) VALUES (?, ?, 1, ?, NULL)",
    );
    const exists = this.database.prepare("SELECT 1 AS found FROM sites_public_content WHERE slug = ? LIMIT 1");
    const read = this.database.prepare("SELECT content_json FROM sites_public_content WHERE slug = ? LIMIT 1");
    const update = this.database.prepare(
      "UPDATE sites_public_content SET content_json = ?, updated_at = ? WHERE slug = ?",
    );
    for (const site of defaultSites) {
      if (!exists.get(site.slug)) {
        insert.run(site.slug, JSON.stringify(site), new Date().toISOString());
        continue;
      }
      if (site.slug === "skilloopz") {
        const row = read.get(site.slug) as { content_json: string } | undefined;
        const current = row ? (JSON.parse(row.content_json) as PublicSiteContent) : undefined;
        if (current?.seo.title === "Skilloopz | Learning network") {
          update.run(
            JSON.stringify({ ...current, seo: site.seo, about: site.about }),
            new Date().toISOString(),
            site.slug,
          );
        }
      }
    }
  }
}

const defaultSites: PublicSiteContent[] = [
  createSite(
    "codexsun",
    "Codexsun",
    "Platform studio",
    "A focused home for the people and products building the next layer of useful software.",
    "Systems that feel clear, capable, and ready to grow.",
    "cyan",
    "CS",
    ["Product platforms", "Shared UI systems", "Operational tooling"],
    "A modular foundation for ambitious teams.",
    "Platform",
    "Build",
    "Dynamic-ready",
    "Codexsun builds clear, capable platforms and shared systems for teams ready to grow.",
    "Codexsun is a platform studio for teams that need strong foundations without losing momentum. We turn complex product surfaces into calm, useful experiences.",
    ["Clarify the system", "Compose the experience", "Ship the next useful version"],
    "Start a platform conversation",
    "hello@codexsun.com",
    "+91 00000 00000",
    "Talk to Codexsun",
    "Bengaluru",
    "Karnataka",
    "India",
    "Bengaluru, Karnataka, India",
    [
      { label: "Website", href: "https://codexsun.com" },
      { label: "LinkedIn", href: "https://www.linkedin.com" },
    ],
  ),
  createSite(
    "devxcrew",
    "DevXcrew",
    "Developer experience",
    "Tools, practices, and people that make shipping software feel lighter and more deliberate.",
    "Make the hard parts easier to repeat.",
    "orange",
    "DX",
    ["Developer tooling", "Engineering workflows", "Technical enablement"],
    "A sharper path from idea to reliable delivery.",
    "DevEx",
    "Ship",
    "Static-ready",
    "DevXcrew makes developer experience practical through better tools, workflows, and technical enablement.",
    "DevXcrew helps engineering teams remove friction from the path between an idea and a dependable release. The work is practical, measurable, and built to last.",
    ["Find the friction", "Make the path visible", "Automate the repeatable"],
    "Improve your developer experience",
    "hello@devxcrew.example",
    "+1 000 000 0000",
    "Work with DevXcrew",
    "Remote",
    "Global",
    "",
    "Remote-first",
    [
      { label: "Website", href: "https://devxcrew.example" },
      { label: "GitHub", href: "https://github.com" },
    ],
  ),
  createSite(
    "skilloopz",
    "Skilloopz",
    "Learning network",
    "Practical learning paths that turn curiosity into confident, repeatable capability.",
    "Keep learning in motion.",
    "violet",
    "SL",
    ["Learning journeys", "Community programs", "Skills intelligence"],
    "A living space for skills, people, and momentum.",
    "Learning",
    "Grow",
    "Content-led",
    "Skilloopz provides industry-focused IT training, mentor-led learning and placement assistance for students and graduates.",
    "Skilloopz provides industry-focused IT training, mentor-led learning and placement assistance for students and graduates.",
    ["Start with a useful question", "Practice in the real world", "Share the next step"],
    "Build a learning journey",
    "hello@skilloopz.example",
    "+1 000 000 0000",
    "Build with Skilloopz",
    "Remote",
    "Global",
    "",
    "Learning network",
    [
      { label: "Website", href: "https://skilloopz.example" },
      { label: "LinkedIn", href: "https://www.linkedin.com" },
    ],
  ),
  createSite(
    "logicx",
    "Logicx Info Tech",
    "Connected software systems",
    "Practical software, ERPNext, Tally integration, websites, and automation for real operations.",
    "Systems that connect the work.",
    "cyan",
    "LX",
    [
      "Custom software",
      "Tally integration",
      "ERPNext delivery",
      "Website engineering",
      "Workflow automation",
      "Hosting and care",
    ],
    "Your systems, data, and people finally in sync.",
    "Systems",
    "Connect",
    "Dynamic-ready",
    "Logicx Info Tech builds custom software, ERPNext, Tally integrations, websites, and workflow automation.",
    "Logicx Info Tech connects operations, finance, and customer workflows through purposeful software that fits the way teams already work.",
    ["Discover the real workflow", "Release in useful stages", "Own the outcome after launch"],
    "Make the next system easier to run",
    "hello@logicx.in",
    "+91 00000 00000",
    "Work with Logicx Info Tech",
    "India",
    "Global delivery",
    "",
    "India / Global delivery",
    [
      { label: "Website", href: "https://logicx.in" },
      { label: "LinkedIn", href: "https://www.linkedin.com" },
    ],
  ),
];

function createSite(
  slug: string,
  name: string,
  eyebrow: string,
  description: string,
  statement: string,
  accent: PublicSiteContent["accent"],
  mark: string,
  services: string[],
  featured: string,
  focus: string,
  mode: string,
  pages: string,
  seoDescription: string,
  about: string,
  approach: string[],
  contactLabel: string,
  email: string,
  phone: string,
  contactHeading: string,
  city: string,
  region: string,
  country: string,
  address: string,
  socialLinks: SiteSocialLink[],
): PublicSiteContent {
  const work = [
    {
      title: `${focus} foundations`,
      type: "Systems",
      description: `A modular base for ${name} to build, operate, and evolve with confidence.`,
    },
    {
      title: `${focus} language`,
      type: "Experience",
      description: `Reusable patterns that make ${name} feel coherent across every public surface.`,
    },
    {
      title: "Next useful version",
      type: "Operations",
      description: `A focused control layer for the people keeping ${name} moving.`,
    },
  ];
  return {
    slug,
    name,
    eyebrow,
    description,
    statement,
    accent,
    mark,
    services,
    stats: [
      { label: "Focus", value: focus },
      { label: "Mode", value: mode },
      { label: "Pages", value: pages },
    ],
    featured,
    seo: {
      title: `${name} | ${slug === "skilloopz" ? "IT Training & Placement Assistance" : eyebrow}`,
      description: seoDescription,
      keywords: [name, eyebrow, ...services],
    },
    about,
    approach,
    work,
    contactLabel,
    contact: { email, phone, label: contactHeading },
    location: { city, region, country, address },
    socialLinks,
    footer: {
      tagline: `${name} — ${eyebrow}.`,
      copyright: `© ${new Date().getFullYear()} ${name}. All rights reserved.`,
    },
    sections: [
      { type: "about", title: `About ${name}`, body: about },
      { type: "services", title: "What lives here", items: services },
      { type: "work", title: "Selected work", items: work },
      { type: "approach", title: "Our approach", items: approach },
      { type: "cta", label: contactLabel },
    ],
  };
}
