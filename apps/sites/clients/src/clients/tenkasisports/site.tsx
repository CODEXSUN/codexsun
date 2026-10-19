import { lazy, Suspense, useState, useEffect } from "react";
import {
  ArrowUpRight,
  Menu,
  X,
  Shield,
  Award,
  BookOpen,
  Globe
} from "lucide-react";
import { initialSitePage } from "@codexsun/sites-api/page-defaults";
import { useSitePublication } from "../../shared/useSitePublication";
import { useClientDocument } from "../../shared/useClientDocument";
import { sitePathname } from "../../shared/sitePathname";
import { SportsHero } from "./sports.hero";
import { SportsStats } from "./sports.stats";
import { SportsBlogPreview, sportsArticles } from "./sports.blogs";
import { sportsPortalUrl } from "./sports.links";
import { headquartersAddress, officeAddress } from "./sports.locations";
import "./sports.css";

const SportsPages = lazy(() => import("./sports.pages").then((module) => ({ default: module.SportsPages })));

const fallback = initialSitePage({
  id: 0,
  uuid: "c0de0006",
  slug: "tenkasisports",
  status: "active"
});
const siteDescription =
  "தென்காசி மாவட்ட விளையாட்டுக் கழகம் · தாயகம் சிவகலை குருகுலம். ஆசான் தி. வீரபாண்டியன் வழிகாட்டலில் சிலம்பம், வர்மக்கலை மற்றும் தற்காப்புப் பயிற்சி.";

export function TenkasiSportsSite() {
  const { content } = useSitePublication("tenkasisports", fallback);
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"ta" | "en">("ta");

  // Read initial language from query param if provided
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("lang");
      if (q === "en" || q === "ta") {
        setLang(q);
      }
    } catch {
      // safe in non-browser context
    }
  }, []);

  const path = sitePathname().replace(/\/$/, "") || "/";
  const isTa = lang === "ta";
  const article = sportsArticles.find((item) => path === `/blogs/${item.slug}`);

  const title =
    path === "/"
      ? isTa
        ? "தென்காசி மாவட்ட விளையாட்டுக் கழகம் | சிவகலை குருகுலம்"
        : "Tenkasi District Sports Club | Sivakalai Gurukulam"
      : article
        ? `${isTa ? article.titleTa : article.titleEn} | Tenkasi District Sports Club`
        : path === "/blogs"
          ? `${isTa ? "பயிற்சிக் கட்டுரைகள்" : "Training Articles"} | Tenkasi District Sports Club`
      : `${path.slice(1).replaceAll("-", " ").toUpperCase()} | ${
          isTa ? "தென்காசி மாவட்ட விளையாட்டுக் கழகம்" : "Tenkasi District Sports Club"
        }`;

  useClientDocument(title, siteDescription, "#781714");

  const navigation = [
    ["/", isTa ? "முகப்பு" : "Home"],
    ["/about", isTa ? "எங்களைப் பற்றி" : "About"],
    ["/syllabus", isTa ? "பாடத்திட்டம்" : "Syllabus"],
    ["/classes", isTa ? "வகுப்புகள்" : "Classes"],
    ["/masters", isTa ? "ஆசான்கள்" : "Masters"],
    ["/gallery", isTa ? "படங்கள்" : "Gallery"],
    ["/blogs", isTa ? "கட்டுரைகள்" : "Articles"],
    ["/contact", isTa ? "தொடர்பு" : "Contact"],
    ["/students", isTa ? "மாணவர்கள்" : "Students"],
    ["/alumni", isTa ? "முன்னாள் மாணவர்கள்" : "Alumni"]
  ];

  return (
    <div className="ts-site">
      <a className="ts-skip" href="#main">
        {isTa ? "முக்கிய பகுதிக்குச் செல்க (Skip to content)" : "Skip to main content"}
      </a>

      <div className="ts-topline">
        <div className="ts-wrap ts-topline-inner">
          <div className="ts-topline-phone">
            <span>{isTa ? "தொடர்புக்கு" : "Call us"}</span>
            <a href="tel:+919843930300">9843930300</a>
          </div>
          <div className="ts-topline-actions">
            <button
              type="button"
              className="ts-lang-toggle"
              onClick={() => setLang(isTa ? "en" : "ta")}
              aria-label={isTa ? "Switch to English" : "தமிழுக்கு மாற்றவும்"}
            >
              <Globe size={15} />
              <span>{isTa ? "English" : "தமிழ்"}</span>
            </button>
            <a href={sportsPortalUrl} className="ts-portal-link" target="_blank" rel="noreferrer">
              {isTa ? "உறுப்பினர் போர்ட்டல்" : "Member Portal"} <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>

      <header className="ts-header">
        <div className="ts-header-inner ts-wrap">
          <a className="ts-brand" href="/" aria-label="Tenkasi District Sports Club Home">
            <img
              src="/club-logo-128.webp"
              alt="Tenkasi District Sports Club logo"
              className="ts-logo-img"
              decoding="async"
              width={52}
              height={52}
            />
            <span className="ts-brand-title">{isTa ? "தென்காசி மாவட்ட விளையாட்டுக் கழகம்" : "Tenkasi District Sports Club"}</span>
          </a>

        <nav
          className={open ? "ts-nav ts-open" : "ts-nav"}
          aria-label="Main navigation"
          id="ts-main-navigation"
        >
          {navigation.map(([href, label]) => (
            <a
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <a
            className="ts-mobile-join"
            href="/join"
            onClick={() => setOpen(false)}
          >
            {isTa ? "பயிற்சியில் இணையுங்கள்" : "Join Training"}
          </a>
        </nav>

        <div className="ts-header-right">
          <a className="ts-button ts-header-btn" href="/join">
            {isTa ? "பயிற்சியில் இணையுங்கள்" : "Join Training"}
            <ArrowUpRight size={16} />
          </a>
          <button
            className="ts-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="ts-main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        </div>
      </header>

      {/* MAIN CONTENT ROUTER */}
      <main id="main">
        {path === "/" ? (
          <HomeView isTa={isTa} />
        ) : (
          <Suspense fallback={<div className="ts-page ts-page-loading ts-wrap" role="status">{isTa ? "பக்கம் ஏற்றப்படுகிறது…" : "Loading page…"}</div>}>
            <SportsPages path={path} content={content} lang={lang} />
          </Suspense>
        )}
      </main>

      {/* FOOTER */}
      <footer className="ts-footer">
        <div className="ts-wrap">
          <div className="ts-footer-top">
            <div className="ts-footer-brand-box">
              <div className="ts-footer-logo-row">
                <img
                  src="/club-logo-128.webp"
                  alt="Tenkasi District Sports Club logo"
                  width={64}
                  height={64}
                  className="ts-footer-logo"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <h2>
                    {isTa
                      ? "தென்காசி மாவட்ட விளையாட்டுக் கழகம்"
                      : "Tenkasi District Sports Club"}
                  </h2>
                  <p className="ts-footer-slogan">
                    {isTa
                      ? "தாயகம்: சிவகலை குருகுலம் | கற்போம் சிலம்பம் • காப்போம் சிலம்பம்"
                      : "Home association: Sivakalai Gurukulam | Learn Silambam • Protect Silambam"}
                  </p>
                </div>
              </div>
              <p className="ts-footer-desc">
                {isTa
                  ? "கலைச்சுடர்மணி ஆசான் தி. வீரபாண்டியன் அவர்களின் தலைமையில் 12,000-க்கும் மேற்பட்ட மாணாக்கர்களை உருவாக்கிய பாரம்பரிய தற்காப்புக் கலைக்கூடம்."
                  : "Guided by Kalaisudarmani Asan T. Veerapandian, preserving ancient Tamil martial arts and grooming noble warriors since 2000."}
              </p>
            </div>
            <div className="ts-footer-cta-box">
              <h3>{isTa ? "உங்கள் தற்காப்புப் பயணம் தொடங்கட்டும்" : "Begin Your Martial Journey"}</h3>
              <p>{isTa ? "தென்காசி மண்ணின் வீரக்கலையைக் கற்றுத் தேருங்கள்." : "Master traditional Tamil self-defense with certified guidance."}</p>
              <a className="ts-button ts-gold-btn" href="/join">
                {isTa ? "மாணவர் சேர்க்கை" : "Enroll for Classes"} <ArrowUpRight size={18} />
              </a>
            </div>
          </div>

          <div className="ts-footer-links-grid">
            <div>
              <h4>{isTa ? "வழிகாட்டி" : "Navigation"}</h4>
              <ul>
                <li><a href="/about">{isTa ? "குருகுல மரபு" : "About Gurukulam"}</a></li>
                <li><a href="/syllabus">{isTa ? "பாடத்திட்டம்" : "Syllabus (Levels 1-3)"}</a></li>
                <li><a href="/classes">{isTa ? "பயிற்சிப் பிரிவுகள்" : "Classes & Batches"}</a></li>
                <li><a href="/masters">{isTa ? "ஆசான் வரலாறு" : "Chief Master & Gurus"}</a></li>
              </ul>
            </div>
            <div>
              <h4>{isTa ? "கள நிகழ்வுகள்" : "Activities"}</h4>
              <ul>
                <li><a href="/events">{isTa ? "போட்டிகளும் நிகழ்வுகளும்" : "Events & Competitions"}</a></li>
                <li><a href="/gallery">{isTa ? "களப் படத்தொகுப்பு" : "Photo Gallery"}</a></li>
                <li><a href="/blogs">{isTa ? "பயிற்சிக் கட்டுரைகள்" : "Training Articles"}</a></li>
                <li><a href="/join">{isTa ? "மாணவர் சேர்க்கை 2026" : "Admissions 2026"}</a></li>
                <li><a href="/contact">{isTa ? "தொடர்பு & முகவரி" : "Contact & Grounds"}</a></li>
                <li><a href="/students">{isTa ? "மாணவர்கள்" : "Students"}</a></li>
                <li><a href="/alumni">{isTa ? "முன்னாள் மாணவர்கள்" : "Alumni"}</a></li>
              </ul>
            </div>
            <div>
              <h4>{isTa ? "நெறிமுறைகள் & போர்ட்டல்" : "Policy & Access"}</h4>
              <ul>
                <li><a href="/privacy">{isTa ? "தனியுரிமைக் கொள்கை" : "Privacy Policy"}</a></li>
                <li><a href="/terms">{isTa ? "கள நெறிமுறைகள்" : "Arena Code of Conduct"}</a></li>
                <li><a href={sportsPortalUrl} target="_blank" rel="noreferrer">{isTa ? "உறுப்பினர் போர்ட்டல்" : "Platform Member Portal"}</a></li>
              </ul>
            </div>
            <div>
              <h4>{isTa ? "தலைமையகம்" : "Headquarters"}</h4>
              <p className="ts-foot-addr">{headquartersAddress}</p>
              <h4 className="ts-foot-office-label">{isTa ? "அலுவலகம்" : "Office"}</h4>
              <p className="ts-foot-addr">{officeAddress}</p>
              <span className="ts-reg-pill">
                {isTa ? "தமிழ்நாடு அரசு பதிவு பெற்றது" : "Tamil Nadu Govt. Registered"}
              </span>
            </div>
          </div>

          <div className="ts-footer-bottom">
            <span>
              © {new Date().getFullYear()} {isTa ? "தென்காசி மாவட்ட விளையாட்டுக் கழகம் · சிவகலை குருகுலம்" : "Tenkasi District Sports Club · Sivakalai Gurukulam"}. All rights reserved.
            </span>
            <span className="ts-tag-pill">
              {isTa ? "குருவே சரணம்! வீரமே தற்காப்பு!" : "Guruve Saranam! Veerame Tharkappu!"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 HOME VIEW                                  */
/* -------------------------------------------------------------------------- */
function HomeView({ isTa }: { isTa: boolean }) {
  return (
    <>
      <SportsHero isTa={isTa} />

      <SportsStats isTa={isTa} />
      {/* STRIP MOTTO */}
      <div className="ts-strip">
        <div className="ts-wrap ts-strip-inner">
          <span className="ts-strip-motto">
            {isTa ? "குருவே சரணம்! வீரமே தற்காப்பு!" : "Refuge in the Master! Valor in Self-Defense!"}
          </span>
          <span className="ts-star">✦</span>
          <span>{isTa ? "பார்வை • இலக்கு • கவனம்" : "Vision • Target • Focus"}</span>
          <span className="ts-star">✦</span>
          <span>{isTa ? "கள ஒழுக்கம் & கட்டுப்பாடு" : "Arena Discipline & Ethics"}</span>
          <span className="ts-star">✦</span>
          <span>{isTa ? "தென்காசி வளர்ச்சி மாவட்டம்" : "Tenkasi District Heritage"}</span>
        </div>
      </div>

      {/* CORE PHILOSOPHY / ABOUT SECTION */}
      <section className="ts-section ts-wrap ts-intro-section">
        <div className="ts-intro-head">
          <span className="ts-eyebrow">01 / {isTa ? "குருகுல மரபு" : "The Living Tradition"}</span>
          <h2>
            {isTa ? "சிலம்பம் என்பது வெறும் தடியடி அல்ல;" : "Silambam is not mere stick fencing;"}
            <br />
            <em>{isTa ? "அறிவு சார்ந்த உன்னத தற்காப்புக் கலை." : "It is a profound science of focus and physics."}</em>
          </h2>
        </div>
        <div className="ts-grid ts-3col ts-pillars-grid">
          <a className="ts-card ts-pillar-card" href="/syllabus">
            <span className="ts-card-icon"><Shield size={28} /></span>
            <h3>{isTa ? "உடல் & மன ஒருமுகப்பாடு" : "Concentration & Internal Energy"}</h3>
            <p>
              {isTa
                ? "கம்பின் சுழற்சி காற்றின் உராய்வினால் 'சுள்... சுள்...' என எழும்பும் ஒலி, மாணவனின் ஐம்புலன்களையும் ஒரு புள்ளியில் குவிக்கிறது."
                : "The swift whip of the staff cuts the air with sonic precision, channeling the student's senses into unified mental presence."}
            </p>
            <ArrowUpRight className="ts-pillar-link-icon" size={20} aria-hidden="true" />
          </a>
          <a className="ts-card ts-pillar-card" href="/syllabus">
            <span className="ts-card-icon"><BookOpen size={28} /></span>
            <h3>{isTa ? "நெறிப்படுத்தப்பட்ட பாடத்திட்டம்" : "Certified 3-Tier Syllabus"}</h3>
            <p>
              {isTa
                ? "சமநிலை, சாண் பிடி துவங்கி சவுக்குச் சுவடு, சதுரச் சுவடி, 108 வர்மப் புள்ளிகள் மற்றும் இரட்டை வாள் வரை முறைப்படுத்தப்பட்ட பயிற்சிகள்."
                : "From beginner footwork and hand-span measurements to lightning whip patterns, 108 Varmam nodes, and dual sword fencing."}
            </p>
            <ArrowUpRight className="ts-pillar-link-icon" size={20} aria-hidden="true" />
          </a>
          <a className="ts-card ts-pillar-card" href="/syllabus">
            <span className="ts-card-icon"><Award size={28} /></span>
            <h3>{isTa ? "பாரம்பரிய குருப் பரம்பரை" : "Ancient Guru Lineage"}</h3>
            <p>
              {isTa
                ? "சண்முக ஆசான், கிருஷ்ணா வாத்தியார், சிவகுரு ஆசான் வழிவந்த மரபில், பல சிறந்த ஆசான்மார்களை உலகுக்கு உருவாக்கிய வரலாறு."
                : "Honoring venerable masters of Sengottai, Kadayam, and Kovilpatti, grooming the next generation of principled teachers."}
            </p>
            <ArrowUpRight className="ts-pillar-link-icon" size={20} aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* SYLLABUS TIERS */}
      <section className="ts-section ts-wrap ts-tiers-section">
        <div className="ts-section-header">
          <div>
            <span className="ts-eyebrow">02 / {isTa ? "பயிற்சி நிலைகள்" : "Curriculum Levels"}</span>
            <h2>
              {isTa ? "மூன்று நிலைகளில்" : "Structured Progression"}
              <br />
              <em>{isTa ? "முழுமையான தற்காப்புத் தேர்ச்சி" : "From Foundation to Master Tier"}</em>
            </h2>
          </div>
          <a className="ts-text-link" href="/syllabus">
            {isTa ? "முழு பாடத்திட்டம் காண்க" : "View Complete Syllabus"} <ArrowUpRight size={18} />
          </a>
        </div>

        <div className="ts-grid ts-3col">
          <a className="ts-card ts-tier-item" href="/syllabus#level-1">
            <span className="ts-tier-num">01</span>
            <h3>{isTa ? "நிலை 1: ஆரம்ப நிலை" : "Level 1: Beginner"}</h3>
            <p className="ts-tier-sub">{isTa ? "அடிப்படை நிலைகளும் சாண் பிடியும்" : "Foundations & Hand-Span Grip"}</p>
            <ul className="ts-tier-points">
              <li>{isTa ? "சமநிலை, பிரிவு நிலை, கவனக் குவிப்பு" : "Samanilai, Pirivu Nilai, Stances"}</li>
              <li>{isTa ? "சாண் பிடி முறை & கம்பு அளவுகள்" : "Saan Pidi (span measurement)"}</li>
              <li>{isTa ? "முன்வீச்சு, வெட்டு & வாரல் முறைகள்" : "Forward cuts and basic sweeps"}</li>
            </ul>
            <span className="ts-arrow-link">{isTa ? "விவரங்கள்" : "Learn more"} →</span>
          </a>

          <a className="ts-card ts-tier-item" href="/syllabus#level-2">
            <span className="ts-tier-num">02</span>
            <h3>{isTa ? "நிலை 2: இடைநிலை" : "Level 2: Intermediate"}</h3>
            <p className="ts-tier-sub">{isTa ? "சுவடு முறைகள் & தீச்சிலம்பம்" : "Combat Footwork & Fire Staff"}</p>
            <ul className="ts-tier-points">
              <li>{isTa ? "ஏறு/இறங்கு வரிசை, இரு/மூன்றடிச் சுவடு" : "Ascending and descending steps"}</li>
              <li>{isTa ? "சதுரச் சுவடி (X பெருக்கல்) & சவுக்கு" : "Sadura Suvadi (X-pattern) & whip strikes"}</li>
              <li>{isTa ? "அலங்காரச் சிலம்பம் & தீச்சிலம்பம்" : "Festival forms & Fire Silambam"}</li>
            </ul>
            <span className="ts-arrow-link">{isTa ? "விவரங்கள்" : "Learn more"} →</span>
          </a>

          <a className="ts-card ts-tier-item ts-gold-card" href="/syllabus#level-3">
            <span className="ts-tier-num ts-badge-gold">03</span>
            <h3>{isTa ? "நிலை 3: உயர் நிலை" : "Level 3: Master"}</h3>
            <p className="ts-tier-sub">{isTa ? "வர்மக்கலை & இரட்டை வாள்" : "Varmam Vital Points & Dual Sword"}</p>
            <ul className="ts-tier-points">
              <li>{isTa ? "பம்பல், பாய்ச்சல் & பதுங்கல் நிலைகள்" : "Tactical springing and evasion leaps"}</li>
              <li>{isTa ? "108 போர்க்கள வர்மப் புள்ளிகள் & முதலுதவி" : "108 battlefield Varmam nodes & first aid"}</li>
              <li>{isTa ? "செடிக்குச்சி & இரட்டை வாள் வீச்சு" : "Sedikkuchi & Double Sword combat"}</li>
            </ul>
            <span className="ts-arrow-link">{isTa ? "விவரங்கள்" : "Learn more"} →</span>
          </a>
        </div>
      </section>

      {/* MASTER HIGHLIGHT */}
      <section className="ts-section ts-wrap ts-master-highlight-section">
        <div className="ts-grid ts-2col ts-master-highlight-card">
          <div className="ts-master-highlight-photo">
            <img
              src="/asan-portrait.webp"
              alt="Kalaisudarmani Asan T. Veerapandian"
              loading="lazy"
              width={480}
              height={560}
            />
          </div>
          <div className="ts-master-highlight-copy">
            <span className="ts-eyebrow">03 / {isTa ? "தலைமை ஆசான்" : "Chief Master"}</span>
            <h2>{isTa ? "கலைச்சுடர்மணி ஆசான் தி. வீரபாண்டியன்" : "Kalaisudarmani Asan T. Veerapandian"}</h2>
            <p className="ts-master-title">
              {isTa
                ? "சிலம்ப வர்ம ஆசான் · வாழ்க்கலை ஆசான் · தென்காசி வளர்ச்சி மாவட்டம்"
                : "Master of Silambam & Varmam · Tenkasi District"}
            </p>
            <p>
              {isTa
                ? "நாட்டு எல்லையைக் காத்த ராணுவ வீரரான தந்தை திரு. திரவிய முருகன் மற்றும் பாரம்பரிய நாட்டு வைத்தியரான தாத்தாவின் ஊக்கத்தால், தனது 12 வயது முதல் சண்முக ஆசான், கிருஷ்ணா வாத்தியார், சிவகுரு ஆசான் ஆகியோரின் அருளால் சிலம்பக் கலையில் தேர்ச்சி பெற்றவர்."
                : "Carrying forward the discipline of his military veteran father Thiraviya Murugan and native healer grandfather, Master Veerapandian trained under legendary masters from age 12, going on to mentor over 12,000 students and train dozens of certified masters."}
            </p>
            <div className="ts-highlight-quote">
              {isTa
                ? "\"வெற்றியும் புகழும் குரு காட்டிய பாதையில் மாணவனின் பாதங்கள் பயணிப்பதனால் மட்டுமே விளைகிறது.\""
                : "\"All victory and glory belong to the master; they are born only when the student's footsteps tread faithfully along the path illuminated by the guru.\""}
            </div>
            <a className="ts-button" href="/masters">
              {isTa ? "முழு ஆசான் வரலாறு காண்க" : "Read Full Biography"}
              <ArrowUpRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* GALLERY STRIP */}
      <section className="ts-section ts-wrap ts-gallery-strip-section">
        <div className="ts-section-header">
          <div>
            <span className="ts-eyebrow">04 / {isTa ? "களக் காட்சிகள்" : "The Arena in Action"}</span>
            <h2>{isTa ? "உண்மையான பயிற்சித் தருணங்கள்" : "Authentic Moments on the Ground"}</h2>
          </div>
          <a className="ts-text-link" href="/gallery">
            {isTa ? "அனைத்து படங்களையும் காண்க" : "View Complete Gallery"} <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="ts-gallery-bento">
          {galleryHighlights.map((image) => (
            <a className="ts-strip-photo" href={image.href} key={image.src}>
              <img src={image.src} alt="" loading="lazy" decoding="async" />
              <span>{isTa ? image.ta : image.en} <ArrowUpRight size={16} aria-hidden="true" /></span>
            </a>
          ))}
        </div>
      </section>

      <SportsBlogPreview isTa={isTa} />

      {/* CALL TO ACTION */}
      <section className="ts-section ts-wrap ts-cta-section">
        <div className="ts-cta-card">
          <span className="ts-eyebrow ts-badge-gold">06 / {isTa ? "மாணவர் சேர்க்கை" : "Admissions Open"}</span>
          <h2>
            {isTa ? "தென்காசி மண்ணில்" : "In Tenkasi District"}
            <br />
            <em>{isTa ? "உங்கள் தற்காப்புப் பயிற்சி தொடங்கட்டும்" : "Begin Your Martial Journey Today"}</em>
          </h2>
          <p>
            {isTa
              ? "6 வயது முதல் ஆண், பெண் இருபாலரும் சேர்க்கப்படுகின்றனர். உங்கள் பெயர் மற்றும் தொடர்பு விவரங்களை பதிவு செய்து ஆசானின் வழிகாட்டலில் இணையுங்கள்."
              : "Admissions open for juniors, youth, and adults. Submit your application online for batch assignment and master verification."}
          </p>
          <div className="ts-cta-buttons">
            <a className="ts-button ts-hero-main-btn" href="/join">
              {isTa ? "இப்போதே விண்ணப்பிக்கவும்" : "Submit Membership Application"}
              <ArrowUpRight size={18} />
            </a>
            <a className="ts-button ts-btn-outline" href="/contact">
              {isTa ? "வினவல் அனுப்ப" : "Contact the Academy"}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default TenkasiSportsSite;

const galleryHighlights = [
  { src: "/lineage-training.webp", href: "/gallery#gallery-4", ta: "பாரம்பரிய ஆயுதங்கள்", en: "Lineage Weapons" },
  { src: "/gallery-stance-1.webp", href: "/gallery#gallery-5", ta: "சமநிலை & சாண் பிடி", en: "Samanilai Stance" },
  { src: "/gallery-stance-2.webp", href: "/gallery#gallery-6", ta: "பிரிவு நிலை", en: "Pirivu Nilai" },
  { src: "/gallery-stance-4.webp", href: "/gallery#gallery-7", ta: "தயார் நிலை & வீச்சு", en: "Combat Ready" },
  { src: "/gallery-stance-5.webp", href: "/gallery#gallery-8", ta: "களப் பயிற்சி", en: "Open Ground Practice" }
];
