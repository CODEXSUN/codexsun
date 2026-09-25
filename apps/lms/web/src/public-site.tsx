import { useState } from "react";
import {
  ArrowRightIcon,
  BookOpenCheckIcon,
  CheckIcon,
  MenuIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { ThemeProvider } from "@codexsun/ui/theme";

type PublicPage = "home" | "programs" | "about";

export function PublicSite({ page }: { page: PublicPage }) {
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <ThemeProvider>
      <div
        className={
          compact ? "min-h-screen bg-background text-foreground" : "min-h-screen bg-background text-foreground"
        }
      >
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
            <a className="flex items-center gap-3" href="/" aria-label="LMS home">
              <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                <BookOpenCheckIcon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold tracking-[0.18em] text-primary uppercase">LMS</span>
                <span className="block text-xs text-muted-foreground">Learning, made clear.</span>
              </span>
            </a>
            <nav
              className="hidden items-center gap-7 text-sm text-muted-foreground md:flex"
              aria-label="Public navigation"
            >
              <a className="hover:text-foreground" href="/programs">
                Programs
              </a>
              <a className="hover:text-foreground" href="/#features">
                Platform
              </a>
              <a className="hover:text-foreground" href="/about">
                About
              </a>
            </nav>
            <div className="hidden items-center gap-2 md:flex">
              <a className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/admin/login">
                Admin
              </a>
              <Button size="sm" render={<a href="/login" />}>
                Sign in
              </Button>
            </div>
            <Button
              className="md:hidden"
              size="icon"
              variant="ghost"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <XIcon /> : <MenuIcon />}
            </Button>
          </div>
          {menuOpen ? (
            <nav
              className="grid gap-1 border-t border-border px-5 py-3 text-sm md:hidden"
              aria-label="Mobile navigation"
            >
              <a className="rounded-md px-3 py-2 hover:bg-muted" href="/programs">
                Programs
              </a>
              <a className="rounded-md px-3 py-2 hover:bg-muted" href="/#features">
                Platform
              </a>
              <a className="rounded-md px-3 py-2 hover:bg-muted" href="/about">
                About
              </a>
              <a className="rounded-md px-3 py-2 font-medium text-primary hover:bg-muted" href="/login">
                Sign in
              </a>
            </nav>
          ) : null}
        </header>
        {page === "home" ? (
          <HomePage compact={compact} />
        ) : page === "programs" ? (
          <ProgramsPage compact={compact} />
        ) : (
          <AboutPage compact={compact} />
        )}
        <PublicTweakPanel compact={compact} onCompactChange={setCompact} />
      </div>
    </ThemeProvider>
  );
}

function HomePage({ compact }: { compact: boolean }) {
  const rhythm = compact ? "py-12" : "py-16";
  return (
    <main>
      <section className={`mx-auto grid max-w-7xl gap-12 px-5 ${rhythm} lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24`}>
        <div className="flex flex-col justify-center">
          <p className="mb-5 flex items-center gap-2 text-sm font-semibold tracking-[0.16em] text-primary uppercase">
            <SparklesIcon className="size-4" /> A calmer way to learn
          </p>
          <h1 className="max-w-3xl text-5xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl">
            Make progress visible for every learner.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            A focused learning management system for private teams: discover programs, follow learning paths, and give
            leaders a clear view of progress.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" render={<a href="/login" />}>
              Enter learner portal <ArrowRightIcon />
            </Button>
            <Button size="lg" variant="outline" render={<a href="/programs" />}>
              Explore programs
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">Built for your company. Configured for your people.</p>
        </div>
        <div className="relative min-h-[390px] overflow-hidden rounded-3xl bg-primary p-7 text-primary-foreground shadow-2xl shadow-primary/15 sm:p-10">
          <div className="absolute -right-24 -top-24 size-64 rounded-full border-[32px] border-primary-foreground/10" />
          <div className="absolute -bottom-28 -left-16 size-64 rounded-full border-[32px] border-primary-foreground/10" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between text-sm">
              <span className="rounded-full bg-primary-foreground/15 px-3 py-1.5">Your learning dashboard</span>
              <span className="text-primary-foreground/70">Q3 2026</span>
            </div>
            <div>
              <p className="text-sm text-primary-foreground/70">This week</p>
              <p className="mt-2 text-5xl font-semibold tracking-tight">4.5 hrs</p>
              <div className="mt-8 grid gap-3">
                <ProgressRow label="Leadership essentials" value="82%" progress="82%" />
                <ProgressRow label="Security foundations" value="64%" progress="64%" />
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-primary-foreground/15 pt-5 text-sm">
              <span className="grid size-9 place-items-center rounded-full bg-primary-foreground/15">AR</span>
              <span>
                <strong className="block font-medium">Alex Rivera</strong>
                <span className="text-primary-foreground/65">12-day learning streak</span>
              </span>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="border-y border-border/70 bg-muted/25">
        <div className={`mx-auto grid max-w-7xl gap-4 px-5 ${rhythm} sm:grid-cols-3 lg:px-8`}>
          <Feature
            icon={BookOpenCheckIcon}
            title="Clear learning paths"
            description="Give every role a practical sequence of courses, activities, and milestones."
          />
          <Feature
            icon={UsersIcon}
            title="Human-scale management"
            description="Help managers support people with simple, useful progress signals."
          />
          <Feature
            icon={ShieldCheckIcon}
            title="Private by design"
            description="Keep company learning, access, and reporting inside your own workspace."
          />
        </div>
      </section>
      <section className={`mx-auto grid max-w-7xl gap-8 px-5 ${rhythm} lg:grid-cols-[0.75fr_1.25fr] lg:px-8`}>
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">Start with confidence</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">One front door for learning.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <AccessCard
            href="/login"
            label="Learner portal"
            description="Continue your assigned courses and track your progress."
          />
          <AccessCard
            href="/admin/login"
            label="Admin portal"
            description="Manage people, programs, and day-to-day learning operations."
          />
          <AccessCard
            href="/sa/login"
            label="Super-admin portal"
            description="Control identity, access, and workspace configuration."
          />
          <AccessCard
            href="/about"
            label="How it works"
            description="See the simple operating model behind the platform."
          />
        </div>
      </section>
    </main>
  );
}

function ProgramsPage({ compact }: { compact: boolean }) {
  return (
    <main className={`mx-auto max-w-7xl px-5 ${compact ? "py-12" : "py-16"} lg:px-8 lg:py-24`}>
      <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">Sample public page</p>
      <h1 className="mt-3 max-w-2xl text-5xl font-semibold tracking-tight">
        Programs that meet people where they are.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
        Use this public catalog as the starting point for your company’s learning offer. Each program can later connect
        to real enrollment, content, and completion data.
      </p>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <ProgramCard level="Foundations" title="New manager essentials" detail="6 lessons · 3 hours" />
        <ProgramCard level="Compliance" title="Security foundations" detail="8 lessons · 2.5 hours" />
        <ProgramCard level="Growth" title="Communication at work" detail="5 lessons · 2 hours" />
      </div>
      <Button className="mt-10" size="lg" render={<a href="/login" />}>
        Sign in to start learning <ArrowRightIcon />
      </Button>
    </main>
  );
}

function AboutPage({ compact }: { compact: boolean }) {
  return (
    <main
      className={`mx-auto grid max-w-7xl gap-12 px-5 ${compact ? "py-12" : "py-16"} lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-24`}
    >
      <div>
        <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">About the platform</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight">Learning operations without the noise.</h1>
      </div>
      <div className="space-y-6 text-lg leading-8 text-muted-foreground">
        <p>
          LMS gives private companies one place to publish learning, guide employees through role-based programs, and
          understand where support is needed.
        </p>
        <p>
          The public site is the invitation. The protected portal is where learning work happens. Each client deployment
          can use its own identity, content, and operating policies.
        </p>
        <Button size="lg" render={<a href="/login" />}>
          Open the portal <ArrowRightIcon />
        </Button>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpenCheckIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl p-4">
      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function AccessCard({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <a
      className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted/40"
      href={href}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{label}</h2>
        <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </a>
  );
}

function ProgramCard({ level, title, detail }: { level: string; title: string; detail: string }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{level}</p>
        <CardTitle className="mt-1 text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <CheckIcon className="size-4 text-success" /> Self-paced learning
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressRow({ label, progress, value }: { label: string; progress: string; value: string }) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-4 text-sm">
        <span>{label}</span>
        <span className="text-primary-foreground/70">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-primary-foreground/15">
        <div className="h-2 rounded-full bg-primary-foreground" style={{ width: progress }} />
      </div>
    </div>
  );
}

function PublicTweakPanel({ compact, onCompactChange }: { compact: boolean; onCompactChange(value: boolean): void }) {
  return (
    <aside className="fixed right-4 bottom-4 z-40 hidden w-56 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-xl sm:block">
      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">View options</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm">Compact spacing</span>
        <button
          className={`relative h-6 w-11 rounded-full transition-colors ${compact ? "bg-primary" : "bg-muted"}`}
          type="button"
          aria-label="Toggle compact spacing"
          aria-pressed={compact}
          onClick={() => onCompactChange(!compact)}
        >
          <span
            className={`absolute top-1 size-4 rounded-full bg-background transition-transform ${compact ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>
    </aside>
  );
}
