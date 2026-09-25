import { useEffect, useRef, useState } from "react";
import { clientPath, type ClientSite } from "../../shared/client-data";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  AwardIcon,
  BotIcon,
  BriefcaseBusinessIcon,
  ChevronDownIcon,
  Code2Icon,
  CompassIcon,
  GraduationCapIcon,
  MenuIcon,
  MoveRightIcon,
  SparklesIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";

const programs = [
  [
    "Full Stack Web Development",
    "Build complete products with interfaces, APIs, databases, and deployment basics.",
    "/skilloopz/images/programs/full-stack-development.webp",
  ],
  [
    "AI & ML",
    "Develop intelligent systems through model training, evaluation, and applied AI projects.",
    "/skilloopz/images/programs/generative-ai.webp",
  ],
  [
    "Data Science",
    "Turn complex data into decision-ready insight with statistics, modeling, and visualization.",
    "/skilloopz/images/programs/data-science-ai.webp",
  ],
  [
    "Data Analysis",
    "Find trends, build useful dashboards, and improve business outcomes with structured data work.",
    "/skilloopz/images/programs/data-science-ai.webp",
  ],
  [
    "VLSI",
    "Learn digital logic, semiconductor fundamentals, simulation, and the VLSI design flow.",
    "/skilloopz/images/programs/cloud-computing.webp",
  ],
  [
    "Medical Coding",
    "Translate healthcare services into accurate, standardized codes for records and billing.",
    "/skilloopz/images/programs/product-management.webp",
  ],
] as const;

const benefits = [
  ["Learn by building", "Turn every new concept into portfolio-ready work, not passive notes.", Code2Icon],
  ["Industry mentors", "Weekly feedback from people who work in the roles you want.", UsersRoundIcon],
  ["AI study companion", "Get unstuck, review concepts, and keep momentum at any hour.", BotIcon],
  [
    "Career launch system",
    "Interview practice, project reviews, hiring partner access, and clear next steps.",
    CompassIcon,
  ],
] as const;

const pathway = [
  ["01", "Choose your path", "Find a program aligned with the work you want to do."],
  ["02", "Build in public", "Learn live, ship guided projects, and get useful feedback."],
  ["03", "Prove your skills", "Graduate with a portfolio that shows how you think."],
  ["04", "Launch your career", "Prepare for interviews and meet hiring partners."],
] as const;

const faqs = [
  [
    "Who are these programs for?",
    "They are designed for beginners, career switchers, and working professionals who want structured, project-led learning.",
  ],
  [
    "How much time should I plan each week?",
    "Most learners spend 8 to 10 hours a week across live sessions, guided practice, and project work.",
  ],
  [
    "Do I get help with placements?",
    "Career preparation, portfolio review, and access to relevant hiring opportunities are part of the learning journey.",
  ],
  [
    "Can I learn while working full-time?",
    "Yes. Sessions, guided work, and the AI companion support flexible learning schedules.",
  ],
] as const;

const mentors = [
  ["Nikhil Maurya", "LearnFlu", "NM", "/skilloopz/images/mentors/nikhil-maurya-generated.png"],
  ["Nidhi", "LearnFlu", "NI", "/skilloopz/images/mentors/nidhi-generated.png"],
  ["Preeyanka", "LearnFlu", "PR", "/skilloopz/images/mentors/preeyanka-generated.png"],
  ["Madhu", "Stock Market", "MA", "/skilloopz/images/mentors/madhu-generated.png"],
] as const;

export function SkilloopzHome({ client }: { client: ClientSite }) {
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-skilloopz-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.14 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="skilloopz-portal overflow-x-clip bg-[#05060d] text-white selection:bg-fuchsia-500/50">
      <SkilloopzHeader client={client} />
      <Hero />
      <StatsRail />
      <TrustedCompanies />
      <JobReadyFormula />
      <Programs client={client} />
      <Benefits />
      <Pathway />
      <Mentors client={client} />
      <Collaborations />
      <SuccessStory client={client} />
      <section data-skilloopz-reveal className="marketing-stage border-y border-white/[.06] bg-white/[.015] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <SectionIntro
            eyebrow="FAQ"
            title="Questions, answered."
            copy="Everything you need to know before you begin."
          />
          <div className="divide-y divide-white/10 border-y border-white/10">
            {faqs.map(([question, answer], index) => {
              const open = openFaq === index;
              return (
                <article key={question}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left font-medium"
                  >
                    <span>{question}</span>
                    <ChevronDownIcon
                      className={`size-5 shrink-0 text-white/60 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open ? <p className="pb-5 leading-7 text-white/60">{answer}</p> : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <FinalCta client={client} />
    </div>
  );
}

function SkilloopzHeader({ client }: { client: ClientSite }) {
  const [open, setOpen] = useState(false);
  const [portalProgress, setPortalProgress] = useState(0);
  const links = [
    ["Programs", "#programs"],
    ["Learning Path", "#pathway"],
    ["Mentors", "#mentors"],
    ["Study Spot", "#success-story"],
    ["About", clientPath(client.slug, "about")],
  ];

  useEffect(() => {
    const onPortalState = (event: Event) => {
      const detail = (event as CustomEvent<{ progress?: number }>).detail;
      setPortalProgress(detail.progress ?? 0);
    };
    window.addEventListener("abhi-portal-state", onPortalState);
    return () => window.removeEventListener("abhi-portal-state", onPortalState);
  }, []);

  const portalInMotion = portalProgress > 0.015 && portalProgress < 1;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 transition-[opacity,transform] duration-300 sm:px-8 sm:pt-4"
      style={{
        opacity: portalInMotion ? 0 : 1,
        pointerEvents: portalInMotion ? "none" : "auto",
        transform: portalInMotion ? "translateY(-1rem)" : "translateY(0)",
      }}
    >
      <nav className="relative flex w-full max-w-[1400px] items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#070711]/55 px-3 py-2.5 shadow-[0_18px_55px_rgba(0,0,0,.18)] backdrop-blur-2xl sm:px-5">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent shadow-[0_0_8px_rgba(255,255,255,.45)]"
        />
        <a href={clientPath(client.slug)} className="shrink-0 px-1.5 sm:px-2" aria-label="Skilloopz home">
          <img
            src="/skilloopz/brand/skilloop-wordmark.png"
            alt="Skilloopz"
            className="h-auto max-h-7 w-auto max-w-[7.75rem] object-contain"
            decoding="async"
          />
        </a>
        <div className="hidden items-center gap-1 xl:flex">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={clientPath(client.slug, "contact")}
            className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-fuchsia-300/20 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(117,60,255,.28)] transition hover:-translate-y-0.5"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-white/45 via-white/95 to-white/45 shadow-[0_0_7px_rgba(255,255,255,.7)]"
            />
            <span className="relative">Apply now</span>
            <ArrowUpRightIcon className="relative size-3.5" />
          </a>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="grid size-10 place-items-center rounded-xl border border-white/15 text-white/80 xl:hidden"
          >
            {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
        {open ? (
          <div className="absolute inset-x-3 top-[calc(100%+0.75rem)] grid gap-1 rounded-2xl border border-white/10 bg-[#090911]/95 p-3 shadow-2xl backdrop-blur-xl xl:hidden">
            {links.map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
              >
                {label}
              </a>
            ))}
          </div>
        ) : null}
      </nav>
    </header>
  );
}

function dissolveOpacity(progress: number, delay: number) {
  const stageProgress = Math.min(1, Math.max(0, (progress - delay) / (1 - delay)));
  return 1 - stageProgress * stageProgress * (3 - 2 * stageProgress);
}

function Hero() {
  const sceneRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetProgress = useRef(0);
  const renderedProgress = useRef(0);
  const frame = useRef<number | null>(null);
  const [sceneProgress, setSceneProgress] = useState(0);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const renderVideoFrame = () => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration)) {
        frame.current = null;
        return;
      }

      const difference = targetProgress.current - renderedProgress.current;
      const nextProgress =
        reducedMotion.matches || Math.abs(difference) < 0.001
          ? targetProgress.current
          : renderedProgress.current + difference * 0.52;
      renderedProgress.current = nextProgress;
      const nextTime = video.duration * nextProgress;

      if (
        Math.abs(video.currentTime - nextTime) >= 0.045 ||
        nextProgress === targetProgress.current
      ) {
        video.currentTime = nextTime;
      }

      frame.current =
        nextProgress === targetProgress.current
          ? null
          : window.requestAnimationFrame(renderVideoFrame);
    };

    const update = () => {
      const bounds = scene.getBoundingClientRect();
      const travel = Math.max(bounds.height - window.innerHeight, 1);
      targetProgress.current = reducedMotion.matches
        ? 0
        : Math.min(1, Math.max(0, -bounds.top / travel));
      setSceneProgress(targetProgress.current);
      window.dispatchEvent(
        new CustomEvent("abhi-portal-state", {
          detail: {
            locked: targetProgress.current < 1,
            progress: targetProgress.current,
          },
        }),
      );

      if (frame.current === null) {
        frame.current = window.requestAnimationFrame(renderVideoFrame);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    reducedMotion.addEventListener("change", update);

    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
      frame.current = null;
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  const copyFadeProgress = Math.min(1, Math.max(0, (sceneProgress - 0.012) / 0.24));
  const handoffProgress = Math.min(1, Math.max(0, (sceneProgress - 0.76) / 0.24));
  const headingOpacity = dissolveOpacity(copyFadeProgress, 0.05);
  const descriptionOpacity = dissolveOpacity(copyFadeProgress, 0.16);
  const ctaOpacity = dissolveOpacity(copyFadeProgress, 0.26);
  const hintOpacity = dissolveOpacity(copyFadeProgress, 0.1);

  return (
    <section ref={sceneRef} className="relative h-[220svh] bg-[#05060d]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover object-[60%_center] will-change-[filter,opacity,transform] sm:object-center"
          muted
          playsInline
          preload="auto"
          aria-label="A glowing portal opens into the Skilloopz learning experience"
          style={{
            filter: `blur(${handoffProgress * 3}px) brightness(${1 - handoffProgress * 0.2})`,
            opacity: 1 - handoffProgress * 0.12,
            transform: `scale(${1 + handoffProgress * 0.025})`,
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = videoRef.current.duration * targetProgress.current;
            }
          }}
        >
          <source src="/skilloopz/videos/abhi-portal-hero.mp4" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 z-[11] bg-[linear-gradient(to_bottom,transparent_35%,rgba(5,6,13,.34)_64%,#05060d_100%)]" style={{ opacity: handoffProgress }} />
        <div className="relative z-10 mx-auto flex h-full max-w-[1360px] items-center px-5 pt-20 sm:px-8 sm:pt-20 lg:px-12">
          <div className="w-full max-w-[30rem] [text-shadow:0_2px_22px_rgba(0,0,0,.7)] sm:max-w-[660px]">
            <h1
              className="max-w-[18rem] origin-left font-serif text-[clamp(2.25rem,11vw,3.4rem)] leading-[.91] tracking-[-.055em] text-white will-change-[opacity,filter,transform] sm:max-w-[660px] sm:text-[clamp(3.45rem,6.3vw,6.8rem)]"
              style={{
                filter: `blur(${(1 - headingOpacity) * 9}px)`,
                opacity: headingOpacity,
                transform: `scale(${0.985 + headingOpacity * 0.015})`,
              }}
            >
              Upskill to the
              <br />
              <span className="hero-gentle-float bg-gradient-to-r from-fuchsia-400 via-violet-400 to-blue-300 bg-clip-text text-transparent">
                Top 1%
              </span>{" "}
              with
              <br />
              Expert-Led Programs
            </h1>
            <p
              className="mt-3 w-full max-w-[30rem] font-sans text-[13px] leading-5 text-white/85 [text-wrap:pretty] will-change-[opacity,filter] sm:mt-6 sm:text-lg sm:leading-7"
              style={{
                filter: `blur(${(1 - descriptionOpacity) * 6}px)`,
                opacity: descriptionOpacity,
              }}
            >
              Scroll through the portal to discover practical programs built for your career.
            </p>
            <a
              href="#programs"
              className="group mt-5 inline-flex w-full items-center justify-between gap-7 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-5 py-3 text-[13px] font-semibold text-white shadow-[0_14px_38px_rgba(125,58,255,.35)] transition-transform will-change-[opacity,filter,transform] active:scale-[.98] sm:mt-8 sm:w-auto sm:px-7 sm:py-4 sm:text-sm sm:hover:-translate-y-0.5"
              style={{
                filter: `blur(${(1 - ctaOpacity) * 5}px)`,
                opacity: ctaOpacity,
                transform: `scale(${0.98 + ctaOpacity * 0.02})`,
              }}
            >
              <span className="hero-gentle-float-content">
                Explore Programs <ArrowUpRightIcon className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          </div>
        </div>
        <div
          className="hero-scroll-cue-float pointer-events-none absolute bottom-7 right-5 z-10 hidden items-center gap-3 text-[10px] font-semibold tracking-[.2em] text-white/80 sm:right-8 sm:flex lg:right-12"
          style={{ opacity: hintOpacity }}
        >
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-fuchsia-300" />
          <span>SCROLL TO ENTER</span>
          <span className="grid size-7 place-items-center rounded-full border border-white/25 text-base font-light">
            <ChevronDownIcon className="size-4" />
          </span>
        </div>
      </div>
    </section>
  );
}

function StatsRail() {
  const stats = [
    ["20K+", "Students Enrolled", UsersRoundIcon],
    ["50+", "Expert Mentors", GraduationCapIcon],
    ["200+", "Hiring Partners", BriefcaseBusinessIcon],
    ["95%", "Placement Rate", AwardIcon],
  ] as const;

  return (
    <section aria-label="Skilloopz outcomes" className="relative z-10 -mt-px px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto grid max-w-[1264px] grid-cols-2 overflow-hidden rounded-2xl border border-white/15 bg-[#060711]/80 backdrop-blur-xl sm:grid-cols-4">
        {stats.map(([value, label, Icon], index) => (
          <div
            key={label}
            className={`flex items-center gap-3 px-4 py-5 sm:px-6 sm:py-6 ${index > 0 ? "border-l border-white/10" : ""} ${index === 2 ? "border-t border-white/10 sm:border-t-0" : ""} ${index === 3 ? "border-t border-white/10 sm:border-t-0" : ""}`}
          >
            <Icon aria-hidden="true" className="size-8 shrink-0 text-violet-300" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="text-xl font-semibold leading-none tracking-tight text-white sm:text-2xl">{value}</p>
              <p className="mt-1 text-[11px] leading-4 text-white/60 sm:text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrustedCompanies() {
  return (
      <section className="w-full border-y border-white/[.06] px-6 py-8 sm:px-10 lg:px-16 lg:py-9">
      <p className="mb-6 text-center text-[10px] font-semibold tracking-[.28em] text-white/55">
        TRUSTED BY LEADING COMPANIES
      </p>
      <div className="trusted-company-marquee mx-auto w-full max-w-[80%]">
        <div className="trusted-company-track">
          {[0, 1].map((set) => (
            <div className="trusted-company-set" aria-hidden={set === 1} key={set}>
              {["Google", "Microsoft", "Amazon", "IBM", "Adobe", "Tesla", "Meta"].map((company) => (
                <span className="trusted-company-mark" key={`${set}-${company}`}>{company}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JobReadyFormula() {
  return (
    <section data-skilloopz-reveal className="marketing-stage relative overflow-hidden px-4 py-20 sm:px-8 lg:px-12 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(136,72,255,.28),transparent_25%),radial-gradient(circle_at_24%_100%,rgba(36,108,255,.14),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-[1360px] items-end gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="text-xs font-semibold tracking-[.22em] text-fuchsia-300">JOB READY FORMULA</p>
          <h2 className="mt-6 max-w-4xl font-serif text-[clamp(3.4rem,7vw,7.6rem)] leading-[.84] tracking-[-.06em]">
            You&apos;re not taking a course.
            <br />
            <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
              You&apos;re rehearsing your next role.
            </span>
          </h2>
        </div>
        <a
          href="#pathway"
          className="rounded-3xl border border-white/15 bg-white/[.045] p-7 backdrop-blur-xl hover:border-fuchsia-300/40"
        >
          <p className="text-4xl font-semibold tracking-tight">01</p>
          <p className="mt-10 max-w-sm text-lg leading-7 text-white/70">
            Every week ends with evidence of progress: work you have made,
            decisions you can defend, and feedback that makes the next version
            stronger.
          </p>
          <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold">
            See the learning path <MoveRightIcon className="size-4" />
          </span>
        </a>
      </div>
    </section>
  );
}

function Programs({ client }: { client: ClientSite }) {
  return (
    <section id="programs" data-skilloopz-reveal className="marketing-stage overflow-hidden px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
      <div className="mx-auto max-w-[1360px]">
        <SectionIntro
          eyebrow="EXPLORE YOUR PATH"
          title="Our popular courses and programs."
          copy="Choose a practical starting point and build the skills your next opportunity asks for."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map(([title, description, image]) => (
            <article data-skilloopz-reveal key={title} className="luminous-panel group overflow-hidden rounded-3xl border border-white/10 bg-[#0b0c15]">
              <div className="relative aspect-[1.55] overflow-hidden">
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c15] via-transparent to-transparent" />
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold tracking-[.2em] text-fuchsia-300">PRACTICAL PROGRAM</p>
                <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{description}</p>
                <a
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"
                  href={clientPath(client.slug, "contact")}
                >
                  Ask about this path <ArrowRightIcon className="size-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section id="why-abhi" data-skilloopz-reveal className="marketing-stage px-6 py-16 sm:px-10 lg:px-16 lg:py-28">
      <div className="mx-auto max-w-[1360px]">
        <SectionIntro
          eyebrow="WHY CHOOSE US?"
          title="Your career needs more than a course."
          copy="A considered system that turns learning time into work you can show, discuss, and build on."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {benefits.map(([title, body, Icon], index) => (
            <article
              key={title}
              data-skilloopz-reveal
              className={`luminous-panel relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.075] via-white/[.018] to-violet-500/[.08] p-7 ${index === 0 || index === 3 ? "md:col-span-2" : ""}`}
            >
              <Icon className="size-7 text-violet-300" strokeWidth={1.5} />
              <h3 className="mt-12 text-2xl font-medium">{title}</h3>
              <p className="mt-3 max-w-md leading-6 text-white/60">{body}</p>
              <span className="absolute bottom-7 right-7 text-xs font-semibold tracking-[.18em] text-white/30">
                SKILLOOPZ / {title.slice(0, 2).toUpperCase()}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pathway() {
  return (
    <section id="pathway" data-skilloopz-reveal className="marketing-stage border-y border-white/[.06] bg-[#080912] px-6 py-16 sm:px-10 lg:px-16 lg:py-28">
      <div className="mx-auto grid max-w-[1360px] gap-12 lg:grid-cols-[.76fr_1.24fr]">
        <SectionIntro
          eyebrow="THE LEARNING PATH"
          title="From first step to first offer."
          copy="No vague finish line. See exactly what happens at every stage of your learning journey."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {pathway.map(([number, title, body], index) => (
            <article
              key={number}
              data-skilloopz-reveal
              className={`luminous-panel rounded-2xl border border-white/10 p-6 ${index === 0 || index === 3 ? "bg-gradient-to-br from-white/[.075] to-violet-500/[.08]" : "bg-white/[.025]"}`}
            >
              <span className="text-sm font-semibold text-fuchsia-300">{number}</span>
              <h3 className="mt-9 text-xl font-medium">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/60">{body}</p>
              <MoveRightIcon className="mt-8 size-5 text-white/45" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Mentors({ client }: { client: ClientSite }) {
  return (
    <section id="mentors" data-skilloopz-reveal className="marketing-stage px-6 py-16 sm:px-10 lg:px-16 lg:py-28">
      <div className="mx-auto max-w-[1360px]">
        <SectionIntro
          eyebrow="MEET THE TEAM"
          title="Our mentors make the difference."
          copy="Learn with people who bring practical context, honest feedback, and a clear view of the work ahead."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {mentors.map(([name, focus, initials, image]) => (
            <article data-skilloopz-reveal key={name} className="luminous-panel group overflow-hidden rounded-3xl border border-white/10 bg-[#0b0c15]">
              <div className="relative aspect-[4/4.5] overflow-hidden">
                <img
                  src={image}
                  alt={`${name}, ${focus} mentor`}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05060d]/80 to-transparent" />
                <span className="absolute bottom-5 left-5 grid size-9 place-items-center rounded-full border border-white/20 bg-black/20 text-xs font-semibold text-white/80">
                  {initials}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold tracking-tight">{name}</h3>
                <p className="mt-1 text-sm text-white/60">{focus}</p>
                <a
                  href={clientPath(client.slug, "contact")}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:border-white/35 hover:bg-white/10"
                >
                  Connect with the team <ArrowUpRightIcon className="size-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Collaborations() {
  return (
    <section id="collaborations" data-skilloopz-reveal className="marketing-stage px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
      <div data-skilloopz-reveal className="luminous-panel mx-auto max-w-[1360px] rounded-[26px] border border-white/[.1] bg-gradient-to-br from-[#101027] via-[#080914] to-[#080914] px-6 py-9 sm:px-10 lg:px-12">
        <p className="text-xs font-semibold tracking-[.22em] text-fuchsia-300">OUR COLLABORATIONS &amp; PARTNERS</p>
        <div className="mt-6 grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <h2 className="max-w-xl font-serif text-4xl leading-[.94] tracking-[-.03em] sm:text-5xl">
              Built closer to the world learners are entering.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-7 text-white/60">
              The strongest learning experiences connect skills, people, and real opportunity with intention.
            </p>
          </div>
          <div className="grid border-y border-white/[.09]">
            {["Industry insight", "Learning community", "Career guidance"].map((item, index) => (
              <div
                key={item}
                className={`grid grid-cols-[42px_1fr_auto] items-center gap-4 py-5 ${index ? "border-t border-white/[.09]" : ""}`}
              >
                <span className="text-xs font-semibold tracking-[.18em] text-white/35">0{index + 1}</span>
                <span className="text-lg font-medium text-white/90">{item}</span>
                <ArrowUpRightIcon className="size-4 text-white/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SuccessStory({ client }: { client: ClientSite }) {
  return (
    <section id="success-story" data-skilloopz-reveal className="marketing-stage px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
      <div data-skilloopz-reveal className="luminous-panel relative mx-auto max-w-[1360px] overflow-hidden rounded-[26px] border border-white/[.11] bg-[#070811] p-6 sm:p-10 lg:p-12">
        <img
          src="/skilloopz/images/fallbacks/learning-card.webp"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover opacity-[.12]"
        />
        <div className="relative grid gap-9 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold tracking-[.22em] text-fuchsia-200/90">OUR SUCCESS STORY</p>
            <h2 className="mt-7 max-w-xl font-serif text-4xl leading-[.92] tracking-[-.035em] sm:text-5xl lg:text-6xl">
              Focus meets forward <span className="text-white/72">motion.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-7 text-white/62">
              We listen and work together to create a truly unique and unforgettable learning experience.
            </p>
            <a
              href={clientPath(client.slug, "contact")}
              className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
            >
              Start your learning journey <ArrowUpRightIcon className="size-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-[20px] border border-white/[.1] bg-white/[.025] p-5 backdrop-blur-xl sm:grid-cols-4">
            {[
              ["300K+", "Sessions"],
              ["24+", "Experts"],
              ["100K+", "Students"],
              ["100%", "Student satisfaction"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-2xl font-semibold tracking-[-.045em] sm:text-3xl">{value}</p>
                <p className="mt-1 text-sm leading-5 text-white/58">{label}</p>
                <span className="mt-3 block h-0.5 w-8 rounded-full bg-gradient-to-r from-fuchsia-300 to-cyan-200" />
              </div>
            ))}
          </div>
        </div>
        <div className="relative mt-8 grid gap-4 border-t border-white/[.09] pt-6 sm:grid-cols-3">
          {[
            ["I left with a portfolio and the confidence to interview.", "Ishita Sharma"],
            ["The project reviews taught me how to think like an engineer.", "Arjun Nair"],
            ["Every module became something real I could show recruiters.", "Maya Joseph"],
          ].map(([quote, name]) => (
            <blockquote key={name} className="border-l border-white/20 px-5 text-sm leading-6 text-white/75">
              “{quote}”<footer className="mt-2 text-xs text-white/40">{name}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ client }: { client: ClientSite }) {
  return (
    <section id="start" className="px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
      <div data-skilloopz-reveal className="luminous-panel relative mx-auto max-w-[1360px] overflow-hidden rounded-[30px] border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-700 via-violet-800 to-indigo-950 px-6 py-14 text-center shadow-[0_30px_100px_rgba(105,53,255,.35)] sm:px-12 sm:py-20">
        <SparklesIcon className="relative mx-auto size-7 text-fuchsia-100" />
        <h2 className="relative mt-6 font-serif text-4xl leading-[.95] tracking-tight sm:text-6xl">
          Ready to start your learning journey?
        </h2>
        <p className="relative mx-auto mt-6 max-w-xl text-lg leading-7 text-white/75">
          Choose a path, build the work, and make your next opportunity feel possible.
        </p>
        <a
          href={clientPath(client.slug, "contact")}
          className="relative mt-9 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 font-semibold text-black hover:bg-white/85"
        >
          Apply now <ArrowUpRightIcon className="size-4" />
        </a>
      </div>
    </section>
  );
}

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold tracking-[.2em] text-fuchsia-300">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-4xl leading-[.95] tracking-tight sm:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-7 text-white/60 sm:text-lg">{copy}</p>
    </div>
  );
}
