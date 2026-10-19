import { useState, type FormEvent } from "react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import {
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Award,
  BookOpen,
  MapPin,
  Clock,
  Sparkles,
  Send,
  Users,
  ChevronRight
} from "lucide-react";
import { sportsPortalUrl } from "./sports.links";
import { headquartersAddress, officeAddress } from "./sports.locations";
import { AlumniPage, StudentsPage } from "./sports.community";
import { SportsBlogPages, sportsArticles } from "./sports.blogs";

type Language = "ta" | "en";

interface SportsPagesProps {
  path: string;
  content: PageContent;
  lang: Language;
}

export function SportsPages({ path, content, lang }: SportsPagesProps) {
  const isTa = lang === "ta";

  // Preserve existing syllabus and admission links.
  const effectivePath =
    path === "/silambam" || path === "/sports" || path === "/programs" ? "/syllabus" : path;

  if (effectivePath === "/blogs" || sportsArticles.some((article) => effectivePath === `/blogs/${article.slug}`)) {
    return <SportsBlogPages path={effectivePath} isTa={isTa} />;
  }

  switch (effectivePath) {
    case "/about":
      return <AboutPage isTa={isTa} content={content} />;
    case "/syllabus":
      return <ProgramsPage isTa={isTa} content={content} />;
    case "/classes":
      return <ClassesPage isTa={isTa} content={content} />;
    case "/masters":
      return <MastersPage isTa={isTa} content={content} />;
    case "/events":
      return <EventsPage isTa={isTa} content={content} />;
    case "/gallery":
      return <GalleryPage isTa={isTa} content={content} />;
    case "/students":
      return <StudentsPage isTa={isTa} />;
    case "/alumni":
      return <AlumniPage isTa={isTa} />;
    case "/join":
    case "/register":
      return <JoinPage isTa={isTa} content={content} />;
    case "/contact":
      return <ContactPage isTa={isTa} content={content} />;
    case "/privacy":
      return <PrivacyPage isTa={isTa} content={content} />;
    case "/terms":
      return <TermsPage isTa={isTa} content={content} />;
    default:
      return <NotFoundPage isTa={isTa} />;
  }
}

/* -------------------------------------------------------------------------- */
/*                                 ABOUT PAGE                                 */
/* -------------------------------------------------------------------------- */
function AboutPage({ isTa }: { isTa: boolean; content: PageContent }) {
  return (
    <article className="ts-page ts-wrap">
      <div className="ts-page-header">
        <span className="ts-badge">
          {isTa ? "குருகுல மரபு & தத்துவம்" : "Gurukulam Heritage & Ethos"}
        </span>
        <h1>
          {isTa
            ? "தென்காசி மாவட்ட விளையாட்டுக் கழகம்"
            : "Tenkasi District Sports Club"}
        </h1>
        <p className="ts-lead">
          {isTa
            ? "சிவகலை குருகுலத்தைத் தாயகமாகக் கொண்டு, தென்காசி மண்ணில் சிலம்பம், வர்மம் மற்றும் தற்காப்புப் பயிற்சியை வளர்க்கும் விளையாட்டுக் கழகம்."
            : "Based at Sivakalai Gurukulam in Tenkasi, the club brings together traditional Silambam, Varmam, and disciplined self-defense training."}
        </p>
      </div>

      <div className="ts-grid ts-2col ts-feature-card">
        <div>
          <h2>{isTa ? "கலையின் தோற்றமும் தத்துவமும்" : "Origin & Philosophy"}</h2>
          <p>
            {isTa
              ? "பழங்காலம் தொட்டே தமிழர்களின் பாரம்பரிய வீர விளையாட்டாகவும் முதன்மைத் தற்காப்புக் கலையாகவும் விளங்குவது சிலம்பக் கலை ஆகும். இக்கலை வெறும் தடியடி அல்ல; இது மனித உடலையும் மனதையும் ஒருமுகப்படுத்த (Concentration) முன்னோர்களால் கணித-இயற்பியல் சூத்திரங்களின் (Physics & Techniques) அடிப்படையில் உருவாக்கப்பட்ட உன்னத அறிவு வடிவம்."
              : "Silambam is the ancient primary martial art of the Tamils. It is not mere stick combat, but a profound science combining sacred geometry, physics, and intense mental concentration developed by ancient masters to align mind, body, and breath."}
          </p>
          <p>
            {isTa
              ? "புராண மரபின்படி சிவபெருமானால் தோற்றுவிக்கப்பட்டு, அகத்திய முனிவர் வழியே இரச்சான், மரச்சான் மற்றும் பாண்டிய மன்னர்களுக்குக் கற்றுக்கொடுக்கப்பட்டதாக வரலாறு கூறுகிறது. ஆங்கிலேயர் ஆட்சிக் காலத்தில் தடை செய்யப்பட்ட இக்கலையை, நம் முன்னோர்கள் கோயில் திருவிழாக்களிலும் ஆன்மீக வழிபாட்டு மரபுகளிலும் அலங்காரச் சிலம்பமாகப் போற்றித் தலைமுறை கடந்து பாதுகாத்து வந்தனர்."
              : "According to martial lore, the discipline traces back through Sage Agastya, the master duo Irachchan and Marachchan, and the historic Pandyan kingdom. When colonial rulers suppressed the martial tradition, local masters heroically preserved it through temple celebrations, rural arenas, and sacred vows."}
          </p>
        </div>
        <div className="ts-image-frame">
          <img
            src="/asan-temple-staff.webp"
            alt={isTa ? "ஆசான் தி. வீரபாண்டியன் சிலம்பப் பார்வை" : "Master T. Veerapandian with Silambam Staff"}
            loading="lazy"
            decoding="async"
            width={960}
            height={1364}
          />
          <div className="ts-caption">
            {isTa
              ? "கலைச்சுடர்மணி ஆசான் தி. வீரபாண்டியன் - கோயில் முற்றத்தில் கம்பு ஏந்திய தோற்றம்"
              : "Kalaisudarmani Asan T. Veerapandian in the temple courtyard with staff"}
          </div>
        </div>
      </div>

      <section className="ts-card ts-section">
        <h2>{isTa ? "ஆசான் - மாணவர் தத்துவம் (Guru-Disciple Bond)" : "The Sacred Master-Student Bond"}</h2>
        <div className="ts-grid ts-3col">
          <div className="ts-step-card">
            <span className="ts-step-num">01</span>
            <h3>{isTa ? "வெற்றுப் பாத்திரம் (The Void State)" : "The Void State (Empty Vessel)"}</h3>
            <p>
              {isTa
                ? "\"எனக்கு ஒன்றும் தெரியாது\" என்ற பணிவான சமநிலையோடு குருவின் முன் நின்றால் மட்டுமே கலையை முழுமையாக உள்வாங்க முடியும்."
                : "Students approach the master with complete humility as an empty vessel, ready to absorb pure knowledge without preconceived notions."}
            </p>
          </div>
          <div className="ts-step-card">
            <span className="ts-step-num">02</span>
            <h3>{isTa ? "முழுமையான கவனம் (Absolute Focus)" : "Zero Distraction & Focus"}</h3>
            <p>
              {isTa
                ? "பார்வை, இலக்கு, கவனம் மூன்றும் சிதறாமல் ஒரே புள்ளியில் நிலைத்திருக்க வேண்டும். சிவபக்தியைக் காட்டிலும் குருபக்தியே சிலம்பத்தில் முதன்மையானது."
                : "Vision, target, and undivided attention remain fixed on a single focal point. Respect for the master underpins true martial attainment."}
            </p>
          </div>
          <div className="ts-step-card">
            <span className="ts-step-num">03</span>
            <h3>{isTa ? "வீரமே தற்காப்பு (Honor & Defense)" : "Strength in Protection"}</h3>
            <p>
              {isTa
                ? "வித்தையை எளியவர்களை அச்சுறுத்தவோ அநீதிக்கோ ஒருபோதும் பயன்படுத்தக் கூடாது; தற்காப்பிற்கும் அறத்திற்குமே கம்பு களமிறங்கும்."
                : "The art is never to intimidate or inflict injustice. Skill is wielded only for righteous self-protection, defense of the weak, and the honor of the land."}
            </p>
          </div>
        </div>
      </section>

      <section className="ts-card ts-pledge-card">
        <div className="ts-pledge-header">
          <ShieldCheck size={32} />
          <div>
            <h2>{isTa ? "சிலம்பத் தற்காப்பு உறுதிமொழி" : "The Sacred Silambam Student Oath"}</h2>
            <p>
              {isTa
                ? "ஒவ்வொரு மாணாக்கரும் களத்தில் எடுக்கும் ஆறு புனித உறுதிமொழிகள்:"
                : "The six solemn vows taken by every initiated Gurukulam student:"}
            </p>
          </div>
        </div>
        <ol className="ts-pledge-list">
          <li>
            <strong>{isTa ? "அகாடமி கட்டுப்பாடு:" : "Academy Discipline:"}</strong>{" "}
            {isTa
              ? "வீரத்தமிழன் பாரம்பரிய சிவகலை குருகுலத்தின் நெறிமுறைகளுக்கும் கட்டுப்பாடுகளுக்கும் எப்போதும் கட்டுப்பட்டு நடப்பேன்."
              : "I shall unconditionally respect and uphold the rules and ethics of Veerathamilan Traditional Sivakalai Gurukulam."}
          </li>
          <li>
            <strong>{isTa ? "குருவின் சொல்:" : "Master's Guidance:"}</strong>{" "}
            {isTa
              ? "என் குருநாதரின் வார்த்தைகளைக் கடவாமல், அவர் காட்டும் நேர்மையான தற்காப்புப் பாதையில் தடம் பிறழாமல் பயணிப்பேன்."
              : "I shall not transgress my master's words and shall walk faithfully along the righteous path of martial discipline."}
          </li>
          <li>
            <strong>{isTa ? "சகோதரத்துவம்:" : "Fraternity of the Arena:"}</strong>{" "}
            {isTa
              ? "களத்தில் சக மாணவ, மாணவிகளை என் உடன் பிறப்புகளாகக் கருதி, எவ்வித வேற்றுமையுமின்றி மரியாதையோடும் அன்புடனும் நடத்துவேன்."
              : "I shall treat all fellow students as my own brethren with utmost dignity, equality, and compassion."}
          </li>
          <li>
            <strong>{isTa ? "அநீதி தவிர்த்தல்:" : "Refusal of Injustice:"}</strong>{" "}
            {isTa
              ? "என்னிடம் இருக்கும் இந்தச் சிலம்ப வித்தையையும் வர்ம ஞானத்தையும் எளியவர்களை அச்சுறுத்தவோ, அநீதிகளுக்கோ பயன்படுத்த மாட்டேன்."
              : "I shall never use this staff fencing skill or Varmam knowledge to threaten the weak or commit any unjust act."}
          </li>
          <li>
            <strong>{isTa ? "உன்னத தற்காப்பு:" : "Righteous Defense:"}</strong>{" "}
            {isTa
              ? "என் உயிருக்கும், பிறர் உயிருக்கும், நாட்டிற்கும் ஆபத்து வரும் உன்னத தற்காப்புச் சூழலில் மட்டுமே என் கம்பையும் வித்தையையும் களம் இறக்குவேன்."
              : "Only in genuine danger to my life, the lives of others, or the nation shall I wield my staff in self-defense."}
          </li>
          <li>
            <strong>{isTa ? "தூய்மையும் பெருமையும்:" : "Purity and Honor:"}</strong>{" "}
            {isTa
              ? "உடலையும் மனதையும் தூய்மையாகவும், ஆரோக்கியமாகவும் வைத்துக் கொண்டு, என் ஆசானுக்கும் நமது குருபரம்பரைக்கும் தமிழ் மண்ணிற்கும் பெருமை சேர்ப்பேன்."
              : "Keeping my body and mind clean, sober, and healthy, I shall always bring honor to my master, our lineage, and Tamil heritage."}
          </li>
        </ol>
        <div className="ts-motto-callout">
          {isTa ? "குருவே சரணம்! வீரமே தற்காப்பு!" : "Refuge in the Guru! Valor in Self-Defense!"}
        </div>
      </section>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                               PROGRAMS PAGE                                */
/* -------------------------------------------------------------------------- */
function ProgramsPage({ isTa }: { isTa: boolean; content: PageContent }) {
  return (
    <article className="ts-page ts-wrap">
      <div className="ts-page-header">
        <span className="ts-badge">{isTa ? "அதிகாரப்பூர்வ பாடத்திட்டம்" : "Certified Syllabus"}</span>
        <h1>{isTa ? "சிலம்பக் கலை & தற்காப்புப் பாடத்திட்டம்" : "Syllabus & Martial Disciplines"}</h1>
        <p className="ts-lead">
          {isTa
            ? "மாணவர்களின் திறனை படிப்படியாக வளர்க்கும் 3 நிலைகள் கொண்ட அங்கீகரிக்கப்பட்ட தற்காப்புப் பயிற்சி நெறி."
            : "A structured, progressive three-tier syllabus designed to systematically develop footwork, staff agility, combat reflexes, and healing knowledge."}
        </p>
      </div>

      <div className="ts-syllabus-grid">
        {/* LEVEL 1 */}
        <div className="ts-level-card" id="level-1">
          <div className="ts-level-head">
            <span className="ts-level-tag">{isTa ? "நிலை 1" : "Level 1"}</span>
            <h2>{isTa ? "ஆரம்ப நிலை (Beginner Level)" : "Beginner Foundations"}</h2>
          </div>
          <p className="ts-level-desc">
            {isTa
              ? "சிலம்பக் கம்பை அளந்து தேர்ந்தெடுத்தல், சாண் பிடி முறை, உடலை ஒருமுகப்படுத்தும் அடிப்படை தற்காப்பு நிலைகள் மற்றும் வீச்சுகள்."
              : "Selecting and seasoning bamboo staves, traditional hand-span measurements, attention stances, and fundamental cuts."}
          </p>
          <ul className="ts-feature-list">
            <li>
              <strong>{isTa ? "சமநிலை (Attention Stance):" : "Samanilai (Attention Stance):"}</strong>{" "}
              {isTa ? "கால்களை நேராகச் சேர்த்து உடலை நிமிர்த்தி நிற்கும் முதன்மை நிலை." : "Legs aligned, posture erect, calm eye contact."}
            </li>
            <li>
              <strong>{isTa ? "பிரிவு நிலை (Ready Stance):" : "Pirivu Nilai (Ready Stance):"}</strong>{" "}
              {isTa ? "வலது காலைச் சற்றே விரித்து ஊன்றி, சூரிய கலையைத் தூண்டும் ஆயத்த நிலை." : "Stance rooted into the earth, engaging breath and internal focus."}
            </li>
            <li>
              <strong>{isTa ? "சாண் பிடி முறை:" : "Saan Pidi (Span Grip):"}</strong>{" "}
              {isTa ? "கம்பின் அடிபாகத்தில் ஒரு சாண் இடைவெளி விட்டு பிடிக்கும் அறிவியல் முறை." : "Precise thumb-to-little-finger grip measurements for maximum leverage."}
            </li>
            <li>
              <strong>{isTa ? "வெட்டு & வாரல்:" : "Vettu & Vaaral (Cuts & Swings):"}</strong>{" "}
              {isTa ? "இடது வெட்டு, வலது வெட்டு மற்றும் சுழல் வாரல் இயக்கங்கள்." : "Forward left and right cuts, reverse sweeps, and foundational wrist rotations."}
            </li>
          </ul>
        </div>

        {/* LEVEL 2 */}
        <div className="ts-level-card" id="level-2">
          <div className="ts-level-head">
            <span className="ts-level-tag">{isTa ? "நிலை 2" : "Level 2"}</span>
            <h2>{isTa ? "இடைநிலை (Intermediate Level)" : "Intermediate Combat & Forms"}</h2>
          </div>
          <p className="ts-level-desc">
            {isTa
              ? "களத்தில் நகரும் சுவடு முறைகள், வேகமான சவுக்கு வீச்சுகள், சதுரச் சுவடி மற்றும் தீச்சிலம்பப் பயிற்சிகள்."
              : "Stepping geometries, whip-speed strikes, rotational shifts, and ceremonial fire staff exhibition arts."}
          </p>
          <ul className="ts-feature-list">
            <li>
              <strong>{isTa ? "சுவடு முறைகள்:" : "Suvadu Murai (Footwork Matrix):"}</strong>{" "}
              {isTa ? "ஏறு வரிசை, இறங்கு வரிசை, இரு அடி மற்றும் மூன்றடிச் சுவடுகள்." : "Ascending and descending forward/backward combat footwork."}
            </li>
            <li>
              <strong>{isTa ? "சதுரச் சுவடி & சவுக்கு:" : "Sadura Suvadi & Savukku:"}</strong>{" "}
              {isTa ? "X-வடிவ பெருக்கல் சுவடு மற்றும் மின்னல் வேக சவுக்கு வீச்சுகள்." : "Diagonal evasion X-patterns and high-velocity whip staff strikes."}
            </li>
            <li>
              <strong>{isTa ? "கிறுக்கி முறைகள்:" : "Kirukki Rotations:"}</strong>{" "}
              {isTa ? "திசை மாறும் தற்காப்புத் திருப்பங்களும் எதிரியை திசைதிருப்பும் உத்திகளும்." : "Rapid pivots, centrifugal spins, and sensory misdirection techniques."}
            </li>
            <li>
              <strong>{isTa ? "தீச்சிலம்பம்:" : "Thee Silambam (Fire Staff):"}</strong>{" "}
              {isTa ? "இருமுனைகளிலும் தீப்பந்தம் ஏந்திச் சுழற்றும் பாரம்பரிய அலங்காரச் சிலம்பம்." : "Traditional dual-flame spinning for festival demonstrations and master control."}
            </li>
          </ul>
        </div>

        {/* LEVEL 3 */}
        <div className="ts-level-card ts-gold-card" id="level-3">
          <div className="ts-level-head">
            <span className="ts-level-tag ts-badge-gold">{isTa ? "நிலை 3" : "Level 3"}</span>
            <h2>{isTa ? "உயர் நிலை & வர்மக்கலை (Master Level)" : "Advanced & Varmam Master Tier"}</h2>
          </div>
          <p className="ts-level-desc">
            {isTa
              ? "போர்க்கள தற்காப்பு பாய்ச்சல்கள், 108 வர்மப் புள்ளிகள், வர்ம முதலுதவி நீவல்கள் மற்றும் இரட்டை வாள் வீச்சு."
              : "Battlefield acrobatics, 108 anatomical Varmam pressure points, vital relief massage, and dual sword combat."}
          </p>
          <ul className="ts-feature-list">
            <li>
              <strong>{isTa ? "பம்பல், பாய்ச்சல் & பதுங்கல்:" : "Tactical Stances:"}</strong>{" "}
              {isTa ? "புலி பாயும் உத்திகள் மற்றும் தற்காப்பு தந்திர பதுங்கல்கள்." : "Springing tiger leaps, low-ground evasion, and defensive camouflage postures."}
            </li>
            <li>
              <strong>{isTa ? "108 வர்மப் புள்ளிகள்:" : "108 Varmam Energy Points:"}</strong>{" "}
              {isTa ? "போர்க்கள வர்மப் புள்ளிகளை அறிதலும், தாக்குதலைத் தடுக்கும் ரகசியங்களும்." : "Anatomical mapping of vital pressure points and tactical countermeasures."}
            </li>
            <li>
              <strong>{isTa ? "வர்ம முதலுதவி நீவல்கள்:" : "Varmam Healing & First Aid:"}</strong>{" "}
              {isTa ? "களத்தில் ஏற்படும் சுளுக்கு, தசைப்பிடிப்புகளுக்கு தட்டல்-நீவல் சிகிச்சை." : "Emergency restorative tapping and soothing techniques under direct master supervision."}
            </li>
            <li>
              <strong>{isTa ? "இரட்டை வாள் & செடிக்குச்சி:" : "Double Sword & Sedikkuchi:"}</strong>{" "}
              {isTa ? "இரு கைகளிலும் வாளேந்தி சுழற்றும் வாள்வீச்சு மற்றும் செடிக்குச்சி முறை." : "Two-handed synchronized sword fencing and short-stick parry systems."}
            </li>
          </ul>
        </div>
      </div>

      <section className="ts-card ts-section">
        <h2>{isTa ? "பாதுகாப்பு & முதலுதவி நெறிமுறைகள்" : "Safety Standards & First Aid Protocol"}</h2>
        <div className="ts-grid ts-3col">
          <div className="ts-mini-card">
            <Clock size={24} />
            <h3>{isTa ? "15 நிமிடம் வார்ம்-அப்" : "15-Minute Warm-Up"}</h3>
            <p>
              {isTa
                ? "கம்பை எடுப்பதற்கு முன் உடலை வளைத்து, தசைப்பிடிப்புகளைத் தவிர்க்கும் ஸ்ட்ரெச்சிங் பயிற்சிகள் கட்டாயம்."
                : "Mandatory full-body dynamic stretching and joint mobility before handling weapons."}
            </p>
          </div>
          <div className="ts-mini-card">
            <Users size={24} />
            <h3>{isTa ? "10 அடி இடைவெளி" : "10-Foot Safety Perimeter"}</h3>
            <p>
              {isTa
                ? "களம் சுற்றும் போது ஒரு மாணவனுக்கும் அடுத்தவருக்கும் இடையே குறைந்தபட்சம் 10 அடி இடைவெளி காக்கப்பட வேண்டும்."
                : "A strict 10-foot radius between spinning students prevents accidental collisions."}
            </p>
          </div>
          <div className="ts-mini-card">
            <ShieldCheck size={24} />
            <h3>{isTa ? "ஆசான் மேற்பார்வை" : "Direct Master Supervision"}</h3>
            <p>
              {isTa
                ? "ஆசானின் உத்தரவு மற்றும் நேரடி கண்காணிப்பின்றி எந்த உயர்நிலைப் பயிற்சியும் மேற்கொள்ளப்பட மாட்டாது."
                : "No advanced sparring or weapon drills occur without the chief master's immediate presence."}
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CLASSES PAGE                                */
/* -------------------------------------------------------------------------- */
function ClassesPage({ isTa }: { isTa: boolean; content: PageContent }) {
  return (
    <article className="ts-page ts-wrap">
      <div className="ts-page-header">
        <span className="ts-badge">{isTa ? "பயிற்சிப் பிரிவுகள்" : "Training Batches"}</span>
        <h1>{isTa ? "வகுப்புகளும் பயிற்சிக் களமும்" : "Classes, Batches & Training Ground"}</h1>
        <p className="ts-lead">
          {isTa
            ? "அனைத்து வயது மற்றும் தகுதி நிலைகளுக்கேற்ப முறைப்படுத்தப்பட்ட பயிற்சிக் களங்கள்."
            : "Disciplined martial training structured by age groups, aptitude, and competitive goals in Tenkasi District."}
        </p>
      </div>

      <div className="ts-grid ts-3col">
        <div className="ts-card">
          <span className="ts-pill">{isTa ? "வயது 6 - 14" : "Ages 6 to 14"}</span>
          <h2>{isTa ? "சிறுவர் & மாணவர் பிரிவு" : "Children & Junior Batch"}</h2>
          <p>
            {isTa
              ? "உடல் வளைவுத்தன்மை, கவனம், ஒழுக்கம் மற்றும் ஆரம்ப நிலை கம்பு சுழற்சிப் பயிற்சிகள். குழந்தைகளின் மனதை ஒருமுகப்படுத்த உதவும் சிறந்த அடித்தளம்."
              : "Focuses on flexibility, balance, respectful conduct, and foundational staff spins. Builds healthy habits and sharp concentration early."}
          </p>
          <ul className="ts-check-list">
            <li>{isTa ? "சமநிலை & சாண் பிடி அறிமுகம்" : "Samanilai & grip basics"}</li>
            <li>{isTa ? "இரு கைகளுக்கான சம சுழற்சி" : "Ambidextrous coordination"}</li>
            <li>{isTa ? "கள ஒழுக்க நெறிகள்" : "Arena discipline & respect"}</li>
          </ul>
          <a className="ts-button ts-full-btn" href="/join">
            {isTa ? "சேர்க்கைக்கு விண்ணப்பிக்கவும்" : "Apply for Junior Batch"}
          </a>
        </div>

        <div className="ts-card">
          <span className="ts-pill">{isTa ? "வயது 15+" : "Ages 15+"}</span>
          <h2>{isTa ? "இளைஞர் & பெரியோர் தற்காப்பு" : "Youth & Adult Self-Defense"}</h2>
          <p>
            {isTa
              ? "தீவிர தற்காப்புப் பயிற்சிகள், நடைமுறை தற்காப்பு உத்திகள், சுவடு முறைகள், சவுக்கு வீச்சு மற்றும் உடல் வலிமை மேம்பாடு."
              : "Practical self-defense tactics, combat footwork, high-speed staff whipping, and mental fortitude under pressure."}
          </p>
          <ul className="ts-check-list">
            <li>{isTa ? "சதுரச் சுவடி & போர் உத்திகள்" : "Sadura Suvadi & tactics"}</li>
            <li>{isTa ? "வர்ம முதலுதவி அறிமுகம்" : "Varmam safety introduction"}</li>
            <li>{isTa ? "உடல் வலிமை & சுறுசுறுப்பு" : "Endurance & stamina"}</li>
          </ul>
          <a className="ts-button ts-full-btn" href="/join">
            {isTa ? "சேர்க்கைக்கு விண்ணப்பிக்கவும்" : "Apply for Adult Batch"}
          </a>
        </div>

        <div className="ts-card ts-gold-card">
          <span className="ts-pill ts-badge-gold">{isTa ? "தேர்வு பெற்றோர்" : "By Selection"}</span>
          <h2>{isTa ? "போட்டிப் பிரிவு & தீச்சிலம்பம்" : "Tournament & Fire Silambam"}</h2>
          <p>
            {isTa
              ? "மாவட்ட, மாநில மற்றும் தேசிய அளவிலான சிலம்பப் போட்டிகளில் பங்கேற்க விரும்புவோருக்கான சிறப்புப் தீவிரப் பயிற்சி."
              : "Intensive training for students preparing for district, state, and national championships, plus traditional fire staff arts."}
          </p>
          <ul className="ts-check-list">
            <li>{isTa ? "நவீன போட்டி விதிமுறைகள்" : "Official tournament rules"}</li>
            <li>{isTa ? "தீச்சிலம்பம் & அலங்கார வீச்சு" : "Fire staff demonstrations"}</li>
            <li>{isTa ? "இரட்டை வாள் வீச்சு" : "Dual sword combat mastery"}</li>
          </ul>
          <a className="ts-button ts-full-btn" href="/join">
            {isTa ? "தகுதித் தேர்வுக்கு விண்ணப்பிக்கவும்" : "Apply for Tournament Team"}
          </a>
        </div>
      </div>

      <div className="ts-card ts-section">
        <h2>{isTa ? "பயிற்சிக்குத் தேவையானவை" : "Training Essentials"}</h2>
        <div className="ts-grid ts-2col">
          <div>
            <h3>{isTa ? "பக்குவப்படுத்தப்பட்ட மூங்கில் கம்பு" : "Seasoned Bamboo Staff"}</h3>
            <p>
              {isTa
                ? "மாணவரின் உயரத்திற்கேற்ப ஆசானால் சாண் அளக்கப்பட்டு பக்குவப்படுத்தப்பட்ட தரமான மூங்கில் கம்பு மட்டுமே களத்தில் பயன்படுத்தப்பட வேண்டும்."
                : "Students train using seasoned, flexible bamboo staves measured to their exact height and arm span by the master."}
            </p>
          </div>
          <div>
            <h3>{isTa ? "நேரம் மற்றும் கள அறிவிப்பு" : "Batch Allocations"}</h3>
            <p>
              {isTa
                ? "தென்காசி மற்றும் சுற்றுவட்டாரக் களங்களுக்கான காலை/மாலை நேர ஒதுக்கீடு, மாணவர் சேர்க்கை பரிசீலனைக்குப் பிறகு ஆசானால் வழங்கப்படும்."
                : "Morning and evening batch times across Tenkasi locations are confirmed upon membership review and student assessment."}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                                MASTERS PAGE                                */
/* -------------------------------------------------------------------------- */
function MastersPage({ isTa }: { isTa: boolean; content: PageContent }) {
  const gurus = [
    { name: isTa ? "கிருஷ்ணர் வாத்தியார்" : "Krishna Vathiyar", place: isTa ? "கோவில்பட்டி" : "Kovilpatti" },
    { name: isTa ? "சண்முக வாத்தியார்" : "Shanmuga Vathiyar", place: isTa ? "செங்கோட்டை" : "Sengottai" },
    { name: isTa ? "சிவகுரு வாத்தியார்" : "Sivaguru Vathiyar", place: isTa ? "கடையம்" : "Kadayam" },
    { name: isTa ? "பொசுக்கர் வாத்தியார்" : "Posukkar Vathiyar", place: isTa ? "கடப்பேபாகத்தி" : "Kadayabogathi" },
    { name: isTa ? "இசக்கிகோனார் வாத்தியார்" : "Isakkikonar Vathiyar", place: isTa ? "செங்கோட்டை" : "Sengottai" },
    { name: isTa ? "சுண்டைக்காய் தாத்தா" : "Sundakkai Thatha", place: isTa ? "செங்கோட்டை, கலங்கரை" : "Sengottai, Kalangarai" },
    { name: isTa ? "மகாலிங்கம் வாத்தியார்" : "Mahalingam Vathiyar", place: isTa ? "வி.கே.புரம்" : "V.K. Puram" },
    { name: isTa ? "அருணாச்சல வாத்தியார்" : "Arunachala Vathiyar", place: isTa ? "குத்துக்கல்வலசை" : "Kuthukkalvalasai" },
    { name: isTa ? "சங்கரா வாத்தியார்" : "Sankara Vathiyar", place: isTa ? "திருநெல்வேலி" : "Tirunelveli" },
    { name: isTa ? "மணி வாத்தியார்" : "Mani Vathiyar", place: isTa ? "தஞ்சாவூர்" : "Thanjavur" },
    { name: isTa ? "அய்யாதுரை கோனார்" : "Ayyadurai Konar", place: isTa ? "டி. கல்லுப்பட்டி" : "T. Kallupatti" },
    { name: isTa ? "முத்துக்குட்டி தேவர்" : "Muthukkutti Thevar", place: isTa ? "காசிமேஜர்புரம்" : "Kasimajorpuram" },
    { name: isTa ? "ஆவுடையம்மாள் வைத்தியர்" : "Avudaiammal Vaithiyar", place: isTa ? "செங்கோட்டை" : "Sengottai" },
    { name: isTa ? "பொன்னம்மாள் வைத்தியர்" : "Ponnammal Vaithiyar", place: isTa ? "கதிரவன் காலனி, செங்கோட்டை" : "Kathiravan Colony, Sengottai" },
    { name: isTa ? "கணபதி சித்த மருத்துவர்" : "Ganapathi Siddha Doctor", place: isTa ? "செங்கோட்டை" : "Sengottai" }
  ];

  return (
    <article className="ts-page ts-wrap">
      <div className="ts-page-header">
        <span className="ts-badge">{isTa ? "குரு பரம்பரை" : "Master Lineage"}</span>
        <h1>{isTa ? "தலைமை ஆசானும் மூத்த குருமார்களும்" : "Chief Master & Heritage Lineage"}</h1>
        <p className="ts-lead">
          {isTa
            ? "தமிழ் மண்ணின் ஆதி தற்காப்புக் கலையின் வேர்களைத் தாங்கிப் பிடிக்கும் பாரம்பரிய ஆசான்மார்கள்."
            : "The venerable lineage of Tamil martial masters whose unbroken tradition and dedication guide Sivakalai Gurukulam."}
        </p>
      </div>

      <div className="ts-grid ts-2col ts-master-spotlight">
        <div className="ts-master-img-wrapper">
          <img
            src="/asan-portrait.webp"
            alt={isTa ? "கலைச்சுடர்மணி ஆசான் தி. வீரபாண்டியன்" : "Kalaisudarmani Asan T. Veerapandian"}
            loading="lazy"
            decoding="async"
            width={664}
            height={1000}
          />
        </div>
        <div>
          <span className="ts-pill">{isTa ? "தலைமை ஆசான் & நிறுவனர்" : "Chief Master & Founder"}</span>
          <h2>{isTa ? "கலைச்சுடர்மணி ஆசான் தி. வீரபாண்டியன்" : "Kalaisudarmani Asan T. Veerapandian"}</h2>
          <p className="ts-subtitle">
            {isTa
              ? "வாழ்க்கலை ஆசான் · தென்காசி வளர்ச்சி மாவட்டம் · ஜவஹர்லால் சிறுவர் மன்றம் சிலம்பு ஆசிரியர்"
              : "Silambam Master, Tenkasi District, Jawaharlal Siruvar Mandram Instructor"}
          </p>
          <p>
            {isTa
              ? "நாட்டு எல்லையைக் காத்த ராணுவ வீரரான தந்தை திரு. திரவிய முருகன் மற்றும் பாரம்பரிய நாட்டு வைத்தியரான தாத்தாவின் ஊக்கத்தால், தனது 12 வயது முதல் சிலம்பக் கலையைத் தீவிரமாகக் கற்று வளர்ந்தவர் ஆசான் தி. வீரபாண்டியன்."
              : "Inspired by his father, soldier Thiraviya Murugan who defended India's frontiers, and his grandfather, an esteemed native herbal healer, Master Veerapandian immersed himself in Silambam from age 12."}
          </p>
          <p>
            {isTa
              ? "சண்முக ஆசான், கிருஷ்ணா வாத்தியார், சிவகுரு ஆசான் மற்றும் கடேபாகத்தி ஆசான் ஆகியோரின் அருளால் கலையில் தேர்ச்சி பெற்று, இதுவரை 12,000-க்கும் மேற்பட்ட மாணவ, மாணவிகளுக்கு சிலம்பக் கலையை முறைப்படி பயிற்றுவித்து, எண்ணற்ற சிறந்த ஆசான்மார்களை உலகிற்கு உருவாக்கித் தந்துள்ளார்."
              : "Under the direct tutelage of Shanmuga Asan, Krishna Vathiyar, Sivaguru Asan, and Kadayabogathi Asan, he attained mastery and has trained over 12,000 students across Tamil Nadu, developing dozens of certified instructors."}
          </p>
          <div className="ts-stat-chips">
            <span className="ts-chip">
              <Award size={18} /> {isTa ? "கலைச்சுடர்மணி விருது" : "Kalaisudarmani Title"}
            </span>
            <span className="ts-chip">
              <Users size={18} /> {isTa ? "12,000+ பயின்ற மாணவர்கள்" : "12,000+ Students Guided"}
            </span>
            <span className="ts-chip">
              <BookOpen size={18} /> {isTa ? "பாடநூல் ஆசிரியர் (2026)" : "Handbook Author (2026)"}
            </span>
          </div>
        </div>
      </div>

      <section className="ts-card ts-section">
        <h2>{isTa ? "பாரம்பரிய குருப் பரம்பரை: மூத்த ஆசான்மார்கள்" : "The Heritage Lineage of Masters"}</h2>
        <p>
          {isTa
            ? "நமது சிவகலை குருகுலத்தின் ஆணிவேராக விளங்கும் செங்கோட்டை, கடையம், கோவில்பட்டி, நெல்லை மண்ணின் மூத்த குருமார்கள்:"
            : "The venerable senior masters and traditional healers who preserved and passed down these sacred martial forms:"}
        </p>
        <div className="ts-guru-grid">
          {gurus.map((guru) => (
            <div key={guru.name} className="ts-guru-pill">
              <span className="ts-guru-name">{guru.name}</span>
              <span className="ts-guru-place">{guru.place}</span>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 EVENTS PAGE                                */
/* -------------------------------------------------------------------------- */
function EventsPage({ isTa }: { isTa: boolean; content: PageContent }) {
  return (
    <article className="ts-page ts-wrap">
      <div className="ts-page-header">
        <span className="ts-badge">{isTa ? "நிகழ்வுகள் & போட்டிகள்" : "Events & Tournaments"}</span>
        <h1>{isTa ? "குருகுல நிகழ்வுகளும் போட்டிக் களமும்" : "Club Events & Tournaments"}</h1>
        <p className="ts-lead">
          {isTa
            ? "கலாச்சார விழாக்கள், மாநிலப் போட்டிகள் மற்றும் மாணவர் தகுதித் தேர்வு நிகழ்வுகள்."
            : "Annual festival exhibitions, state championships, and student grading examinations."}
        </p>
      </div>

      <div className="ts-timeline">
        <div className="ts-event-card">
          <div className="ts-event-date">
            <Calendar size={24} />
            <span>{isTa ? "ஆண்டுதோறும்" : "Annual Event"}</span>
          </div>
          <div className="ts-event-content">
            <h2>{isTa ? "சிவகலை குருகுல ஆண்டு விழா & சிலம்பக் கலை நிகழ்ச்சி" : "Annual Sivakalai Gurukulam Day & Exhibition"}</h2>
            <p>
              {isTa
                ? "அனைத்து மாணாக்கர்களும் தங்கள் சிலம்ப, தீச்சிலம்ப, வாள்வீச்சு மற்றும் வர்மக் கலைத்திறன்களை பொதுமக்களுக்கு அரங்கேற்றும் பிரம்மாண்ட பெருவிழா."
                : "A grand public demonstration where students perform traditional staff fencing, fire spinning, dual sword forms, and self-defense drills."}
            </p>
            <span className="ts-tag">{isTa ? "தென்காசி களம்" : "Tenkasi Grounds"}</span>
          </div>
        </div>

        <div className="ts-event-card">
          <div className="ts-event-date">
            <Award size={24} />
            <span>{isTa ? "அரையாண்டுக்கு ஒருமுறை" : "Bi-Annual"}</span>
          </div>
          <div className="ts-event-content">
            <h2>{isTa ? "அதிகாரப்பூர்வ தகுதித் தேர்வுகள் & சான்றிதழ் வழங்கல்" : "Student Level Grading & Certification"}</h2>
            <p>
              {isTa
                ? "நிலை 1 (ஆரம்பம்), நிலை 2 (இடைநிலை), நிலை 3 (உயர்நிலை) தேர்வு குழுவினர் முன்னிலையில் நடைபெறும் அதிகாரப்பூர்வ தகுதித் தேர்வுகள்."
                : "Formal examination for Level 1, Level 2, and Level 3 mastery conducted before the examination committee with accredited certificate issuance."}
            </p>
            <span className="ts-tag">{isTa ? "அகாடமி தேர்வு அரங்கம்" : "Academy Grading Hall"}</span>
          </div>
        </div>

        <div className="ts-event-card">
          <div className="ts-event-date">
            <Sparkles size={24} />
            <span>{isTa ? "தொடர் நிகழ்வு" : "State Schedule"}</span>
          </div>
          <div className="ts-event-content">
            <h2>{isTa ? "மாநில & தேசிய சிலம்பப் போட்டிகள்" : "State & National Silambam Championships"}</h2>
            <p>
              {isTa
                ? "தமிழ்நாடு மற்றும் தேசிய அளவிலான சிலம்ப விளையாட்டுப் போட்டிகளில் பங்கேற்று பதக்கங்களை வெல்லும் சிவகலை அணி."
                : "Our competitive squad represents Sivakalai Gurukulam at verified district, state, and national Silambam tournaments."}
            </p>
            <span className="ts-tag">{isTa ? "தமிழ்நாடு" : "Tamil Nadu"}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                                GALLERY PAGE                                */
/* -------------------------------------------------------------------------- */
function GalleryPage({ isTa }: { isTa: boolean; content: PageContent }) {
  const images = [
    {
      src: "/asan-temple-staff.webp",
      title: isTa ? "ஆசான் தி. வீரபாண்டியன் - தற்காப்புக் களத் தோற்றம்" : "Master T. Veerapandian in Martial Stance",
      desc: isTa ? "மூங்கில் சிலம்பக் கம்புடன் கோவில் முற்றத்தில் கம்பீரத் தோற்றம்" : "Holding the bamboo staff in temple courtyard"
    },
    {
      src: "/club-logo-640.webp",
      title: isTa ? "தென்காசி மாவட்ட விளையாட்டுக் கழக சின்னம்" : "Tenkasi District Sports Club logo",
      desc: isTa ? "கழகத்தின் அடையாளச் சின்னம்" : "The club's visual identity"
    },
    {
      src: "/asan-portrait.webp",
      title: isTa ? "தலைமை ஆசான் உருவப்படம்" : "Chief Master Portrait",
      desc: isTa ? "கலைச்சுடர்மணி தி. வீரபாண்டியன் - வாழ்க்கலை ஆசான்" : "Kalaisudarmani T. Veerapandian"
    },
    {
      src: "/lineage-training.webp",
      title: isTa ? "பாரம்பரிய குருமார் & தற்காப்புக் களம்" : "Martial Lineage & Arena Ground",
      desc: isTa ? "பாரம்பரிய ஆயுதங்கள் மற்றும் களப் பயிற்சி மரபு" : "Traditional weapons arsenal and sparring ground"
    },
    {
      src: "/gallery-stance-1.webp",
      title: isTa ? "சமநிலை & கம்பு அளவுகள்" : "Samanilai (Attention Stance)",
      desc: isTa ? "சாண் பிடி முறை மற்றும் உடலமைப்பிற்கு ஏற்ப கம்பு தேர்வு" : "Measuring staff proportions with hand-span rule"
    },
    {
      src: "/gallery-stance-2.webp",
      title: isTa ? "பிரிவு நிலை / ஆயத்த நிலை" : "Pirivu Nilai (Ready Stance)",
      desc: isTa ? "களத்தை உற்று நோக்கும் தற்காப்புத் தயார் நிலை" : "Engaging ground rooting and visual focus"
    },
    {
      src: "/gallery-stance-4.webp",
      title: isTa ? "தயார் நிலை & முன்வீச்சு" : "Combat Ready & Swing Stance",
      desc: isTa ? "கம்பை சுழற்றி எதிரியை எதிர்கொள்ளும் தற்காப்பு வீச்சு" : "Dynamic staff swing and defensive framing"
    },
    {
      src: "/gallery-stance-5.webp",
      title: isTa ? "களப் பயிற்சி தருணம்" : "Open Ground Practice",
      desc: isTa ? "இயற்கையான திறந்தவெளிக் களத்தில் மாணாக்கரின் தீவிர பயிற்சி" : "Open air training ground in rural Tenkasi"
    }
  ];

  return (
    <article className="ts-page ts-wrap">
      <div className="ts-page-header">
        <span className="ts-badge">{isTa ? "படத்தொகுப்பு" : "Visual Archive"}</span>
        <h1>{isTa ? "குருகுலக் களப் படத்தொகுப்பு" : "Gurukulam Training Gallery"}</h1>
        <p className="ts-lead">
          {isTa
            ? "மாணவர்களின் தற்காப்பு நிலைகள், ஆசானின் களத்தோற்றம் மற்றும் சிவகலை குருகுலக் களக் காட்சிகள்."
            : "Authentic photographs from the official handbook, stances, weapons demonstrations, and training moments."}
        </p>
      </div>

      <div className="ts-gallery-grid">
        {images.map((item, idx) => (
          <div key={idx} className="ts-gallery-item" id={`gallery-${idx + 1}`}>
            <img src={item.src} alt={item.title} loading="lazy" decoding="async" />
            <div className="ts-gallery-meta">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  JOIN PAGE                                 */
/* -------------------------------------------------------------------------- */
function JoinPage({ isTa }: { isTa: boolean; content: PageContent }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    gender: "male",
    dateOfBirth: "",
    parentName: "",
    phone: "",
    emergencyContact: "",
    email: "",
    location: "Tenkasi",
    notes: ""
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    if (!name || name.length < 2) {
      setErrorMessage(
        isTa ? "மாணவர் பெயர் குறைந்தது 2 எழுத்துகள் கொண்டிருக்க வேண்டும்." : "Student name must be at least 2 characters."
      );
      return;
    }

    if (!email || !email.includes("@")) {
      setErrorMessage(
        isTa ? "செல்லுபடியாகும் மின்னஞ்சல் முகவரி தேவை." : "A valid email address is required."
      );
      return;
    }

    if (!phone) {
      setErrorMessage(isTa ? "கைபேசி எண் தேவை." : "Phone number is required.");
      return;
    }

    if (!password || password.length < 12) {
      setErrorMessage(
        isTa
          ? "கடவுச்சொல் குறைந்தது 12 எழுத்துகள் கொண்டிருக்க வேண்டும்."
          : "Password must be at least 12 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(isTa ? "கடவுச்சொற்கள் பொருந்தவில்லை." : "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        email,
        phone,
        dateOfBirth: formData.dateOfBirth.trim() || undefined,
        gender: formData.gender,
        guardianName: formData.parentName.trim() || undefined,
        guardianPhone: formData.emergencyContact.trim() || phone || undefined,
        emergencyContact: formData.emergencyContact.trim() || phone || undefined,
        medicalNotes: formData.notes.trim() || "",
        address: formData.location.trim() || "Tenkasi",
        password
      };

      const res = await fetch("/api/sportsclub/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg =
          errJson?.error?.message ||
          errJson?.message ||
          (isTa
            ? "விண்ணப்பத்தைப் பதிவு செய்வதில் சிக்கல் ஏற்பட்டது. தயவுசெய்து விவரங்களைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்."
            : "Failed to submit membership application. Please check your details and try again.");
        setErrorMessage(msg);
        return;
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        const msg =
          json.error?.message ||
          (isTa ? "பதிவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "Registration failed. Please try again.");
        setErrorMessage(msg);
        return;
      }

      const confirmedRef =
        json.data.memberUuid || json.data.userUuid || json.data.reference || "CONFIRMED";
      setReference(confirmedRef);
      setPassword("");
      setConfirmPassword("");
      setSubmitted(true);
    } catch {
      setErrorMessage(
        isTa
          ? "நெட்வொர்க் இணைப்பு பிழை. உங்கள் இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்."
          : "Network connection error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <article className="ts-page ts-wrap">
        <div className="ts-receipt-card">
          <CheckCircle2 size={56} className="ts-success-icon" />
          <h1>{isTa ? "விண்ணப்பம் வெற்றிகரமாகப் பெறப்பட்டது!" : "Application Received Successfully!"}</h1>
          <p className="ts-lead">
            {isTa
              ? "சிவகலை குருகுலத்தில் இணைவதற்கான உங்கள் விண்ணப்பம் பதிவு செய்யப்பட்டுள்ளது."
              : "Your membership application for Sivakalai Gurukulam has been recorded."}
          </p>
          <div className="ts-receipt-ref">
            <span>{isTa ? "விண்ணப்பக் குறிப்பு எண் (Reference):" : "Application Reference ID:"}</span>
            <strong>{reference}</strong>
          </div>
          <div className="ts-receipt-summary">
            <p>
              <strong>{isTa ? "மாணவர் பெயர்:" : "Student Name:"}</strong> {formData.name}
            </p>
            <p>
              <strong>{isTa ? "மின்னஞ்சல்:" : "Email:"}</strong> {formData.email}
            </p>
            <p>
              <strong>{isTa ? "தொடர்பு எண்:" : "Phone:"}</strong> {formData.phone}
            </p>
            <p>
              <strong>{isTa ? "வசிக்கும் பகுதி:" : "Location:"}</strong> {formData.location}
            </p>
            <p>
              <strong>{isTa ? "பாடத்திட்டம்:" : "Curriculum:"}</strong>{" "}
              {isTa ? "பாரம்பரிய சிலம்பம் & வர்மக்கலை" : "Traditional Silambam & Martial Arts"}
            </p>
          </div>
          <p className="ts-receipt-note">
            {isTa
              ? "குருகுல ஆசான் அல்லது நிர்வாகக் குழுவினர் விரைவில் உங்கள் கைபேசி எண்ணைத் தொடர்பு கொண்டு களம், நேரம் மற்றும் சரிபார்ப்பு விவரங்களை அறிவிப்பார்கள்."
              : "The academy administration or master will contact your phone number shortly to confirm batch timing, venue, and onboarding steps."}
          </p>
          <a className="ts-button" href="/">
            {isTa ? "முகப்புப் பக்கத்திற்குத் திரும்புக" : "Return to Home"}
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className="ts-page ts-wrap">
      <div className="ts-page-header">
        <span className="ts-badge">{isTa ? "மாணவர் சேர்க்கை 2026" : "Admissions 2026"}</span>
        <h1>{isTa ? "பயிற்சியில் இணையுங்கள்" : "Join the Gurukulam"}</h1>
        <p className="ts-lead">
          {isTa
            ? "வீரத்தமிழன் பாரம்பரிய சிவகலை குருகுலத்தில் சிலம்பம், வர்மக்கலை கற்க உங்கள் விவரங்களைப் பதிவு செய்யவும்."
            : "Enroll for traditional Silambam, martial footwork, and disciplined self-defense under Master T. Veerapandian."}
        </p>
      </div>

      <div className="ts-grid ts-2col ts-join-layout">
        <form className="ts-form-card" onSubmit={handleSubmit}>
          <h2>{isTa ? "மாணவர் சேர்க்கை விண்ணப்பப் படிவம்" : "Membership Application Form"}</h2>
          <p className="ts-form-intro">
            {isTa ? "* குறியிட்ட விவரங்கள் கட்டாயம்." : "Fields marked * are required."}
          </p>

          {errorMessage ? (
            <div className="ts-form-error" role="alert">
              {errorMessage}
            </div>
          ) : null}

          <h3 className="ts-form-section-title">{isTa ? "மாணவர் மற்றும் பாதுகாவலர் விவரங்கள்" : "Student and guardian details"}</h3>
          <div className="ts-field">
            <label htmlFor="name">{isTa ? "மாணவர் முழுப்பெயர் *" : "Student Full Name *"}</label>
            <input
              id="name"
              required
              type="text"
              placeholder={isTa ? "எ.கா. பாண்டியன்" : "e.g. S. Pandian"}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="ts-field-row">
            <div className="ts-field">
              <label htmlFor="dob">{isTa ? "பிறந்த தேதி (விருப்பத்தேர்வு)" : "Date of Birth (Optional)"}</label>
              <input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="ts-field">
              <label htmlFor="gender">{isTa ? "பாலினம் *" : "Gender *"}</label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="male">{isTa ? "ஆண் (Male)" : "Male"}</option>
                <option value="female">{isTa ? "பெண் (Female)" : "Female"}</option>
                <option value="other">{isTa ? "மற்றவை (Other)" : "Other"}</option>
              </select>
            </div>
          </div>

          <div className="ts-field-row">
            <div className="ts-field">
              <label htmlFor="parentName">
                {isTa ? "பெற்றோர் / பாதுகாவலர் பெயர் (18 வயதுக்குட்பட்டோருக்கு)" : "Parent / Guardian Name (For minors)"}
              </label>
              <input
                id="parentName"
                type="text"
                placeholder={isTa ? "தந்தை / தாய் பெயர்" : "Parent / Guardian Full Name"}
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
              />
            </div>
            <div className="ts-field">
              <label htmlFor="emergencyContact">
                {isTa ? "அவசரக்கால தொடர்பு எண்" : "Emergency Contact Phone"}
              </label>
              <input
                id="emergencyContact"
                type="tel"
                placeholder="+91 98765 00000"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
            </div>
          </div>

          <h3 className="ts-form-section-title">{isTa ? "தொடர்பு விவரங்கள்" : "Contact details"}</h3>
          <div className="ts-field-row">
            <div className="ts-field">
              <label htmlFor="phone">{isTa ? "கைபேசி எண் (WhatsApp) *" : "Phone / WhatsApp *"}</label>
              <input
                id="phone"
                required
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="ts-field">
              <label htmlFor="email">{isTa ? "மாணவர் மின்னஞ்சல் முகவரி *" : "Student Email Address *"}</label>
              <input
                id="email"
                required
                type="email"
                placeholder="student@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <h3 className="ts-form-section-title">{isTa ? "மாணவர் போர்டல் அணுகல்" : "Student portal access"}</h3>
          <div className="ts-field-row">
            <div className="ts-field">
              <label htmlFor="password">
                {isTa ? "மாணவர் போர்டல் கடவுச்சொல் (குறைந்தது 12 எழுத்துகள்) *" : "Student Portal Password (min 12 chars) *"}
              </label>
              <input
                id="password"
                required
                type="password"
                minLength={12}
                maxLength={128}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="ts-field">
              <label htmlFor="confirmPassword">
                {isTa ? "கடவுச்சொல்லை மீண்டும் உள்ளிடவும் *" : "Confirm Password *"}
              </label>
              <input
                id="confirmPassword"
                required
                type="password"
                minLength={12}
                maxLength={128}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <h3 className="ts-form-section-title">{isTa ? "கூடுதல் விவரங்கள்" : "Additional details"}</h3>
          <div className="ts-field">
            <label htmlFor="location">{isTa ? "வசிக்கும் ஊர் / முகவரி *" : "Residence / Address in Tenkasi District *"}</label>
            <input
              id="location"
              required
              type="text"
              placeholder={isTa ? "எ.கா. தென்காசி, செங்கோட்டை, கடையம்" : "e.g. Tenkasi, Sengottai, Kadayam"}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="ts-field">
            <label htmlFor="notes">{isTa ? "கூடுதல் தகவல் / மருத்துவக் குறிப்புகள்" : "Additional Notes / Medical info"}</label>
            <textarea
              id="notes"
              rows={3}
              placeholder={isTa ? "உடல்நலம் சார்ந்த குறிப்புகள் ஏதேனும் இருப்பின் குறிப்பிடவும்..." : "Any health conditions or preferred timing..."}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="ts-button ts-submit-btn">
            {loading ? (isTa ? "பதிவு செய்யப்படுகிறது..." : "Submitting...") : (
              <>
                <Send size={18} /> {isTa ? "விண்ணப்பத்தைச் சமர்ப்பிக்கவும்" : "Submit Membership Application"}
              </>
            )}
          </button>
        </form>

        <div className="ts-join-sidebar">
          <div className="ts-card ts-highlight-box">
            <h3>{isTa ? "சேர்க்கை வழிகாட்டுதல்" : "Enrollment Guidelines"}</h3>
            <ul className="ts-check-list">
              <li>{isTa ? "6 வயது முதல் ஆண், பெண் இருபாலரும் சேர்க்கப்படுவர்." : "Open to boys, girls, youth, and adults ages 6 and up."}</li>
              <li>{isTa ? "பயிற்சிக்கு தகுந்த மூங்கில் கம்பை ஆசான் வழிகாட்டுதலில் பெறலாம்." : "Seasoned staves are sized by the master during initial session."}</li>
              <li>{isTa ? "கள ஒழுக்கம் மற்றும் குரு மரியாதை கட்டாயம் கடைப்பிடிக்கப்பட வேண்டும்." : "Strict adherence to arena discipline and student oath is required."}</li>
              <li>{isTa ? "விண்ணப்பம் பதிவு செய்யப்பட்டதும், ஆசான் உங்களைத் தொடர்புகொள்வார்." : "The academy verifies all details before confirming batch start date."}</li>
            </ul>
          </div>

          <div className="ts-card">
            <h3>{isTa ? "உறுப்பினரா? போர்ட்டலில் நுழையுங்கள்" : "Existing Member or Master?"}</h3>
            <p>
              {isTa
                ? "ஏற்கனவே சிவகலை குருகுல மாணவர் அல்லது ஆசானாக பதிவு பெற்றவர்கள் பிளாட்ஃபார்ம் கணக்கு மூலம் போர்ட்டலை அணுகலாம்."
                : "Enrolled students and certified masters can access training logs and master feedback through the Codexsun desk."}
            </p>
            <a href={sportsPortalUrl} className="ts-button ts-portal-link" target="_blank" rel="noreferrer">
              {isTa ? "போர்ட்டலைத் திறக்குக" : "Open Sportsclub Portal"} <ArrowUpRight size={18} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CONTACT PAGE                                */
/* -------------------------------------------------------------------------- */
function ContactPage({ isTa }: { isTa: boolean; content: PageContent }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    consent: false
  });

  async function handleContact(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const name = contactData.name.trim();
    const email = contactData.email.trim().toLowerCase();
    const phone = contactData.phone.trim();
    const message = contactData.message.trim();

    if (!name || name.length < 2) {
      setErrorMessage(
        isTa ? "பெயர் குறைந்தது 2 எழுத்துகள் கொண்டிருக்க வேண்டும்." : "Name must be at least 2 characters."
      );
      return;
    }

    if (!email || !email.includes("@")) {
      setErrorMessage(
        isTa ? "செல்லுபடியாகும் மின்னஞ்சல் முகவரி தேவை." : "A valid email address is required."
      );
      return;
    }

    if (!message || message.length < 5) {
      setErrorMessage(
        isTa ? "செய்தி குறைந்தது 5 எழுத்துகள் கொண்டிருக்க வேண்டும்." : "Message must be at least 5 characters."
      );
      return;
    }

    if (!contactData.consent) {
      setErrorMessage(
        isTa
          ? "படிவத்தைச் சமர்ப்பிக்கத் தனியுரிமைக் கொள்கையை ஏற்க வேண்டும்."
          : "You must accept the privacy policy to submit."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/sportsclub/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          interest: "Silambam Training",
          message,
          consent: true
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg =
          errJson?.error?.message ||
          errJson?.message ||
          (isTa
            ? "செய்தியை அனுப்புவதில் சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
            : "Failed to send enquiry. Please check your details and try again.");
        setErrorMessage(msg);
        return;
      }

      const json = await res.json();
      if (!json.success) {
        const msg =
          json.error?.message ||
          (isTa ? "செய்தி பதிவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "Enquiry submission failed. Please try again.");
        setErrorMessage(msg);
        return;
      }

      const ref = json.data?.reference || json.data?.uuid || "";
      setReference(ref);
      setSent(true);
    } catch {
      setErrorMessage(
        isTa
          ? "நெட்வொர்க் இணைப்பு பிழை. உங்கள் இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்."
          : "Network connection error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="ts-page ts-wrap">
      <div className="ts-page-header">
        <span className="ts-badge">{isTa ? "தொடர்பு கொள்ள" : "Get In Touch"}</span>
        <h1>{isTa ? "குருகுலத் தொடர்பும் கள முகவரியும்" : "Contact & Training Grounds"}</h1>
        <p className="ts-lead">
          {isTa
            ? "மாணவர் சேர்க்கை, கள நிகழ்வுகள் மற்றும் பொது வினவல்களுக்குத் தொடர்பு கொள்ளவும்."
            : "Direct your admissions questions, event invitations, or training inquiries to the Gurukulam staff."}
        </p>
      </div>

      <div className="ts-grid ts-2col ts-contact-layout">
        <div className="ts-contact-info ts-card">
          <h2>{isTa ? "குருகுலத் தகவல்கள்" : "Gurukulam Details"}</h2>
          <div className="ts-info-item">
            <MapPin size={24} />
            <div>
              <h3>{isTa ? "தலைமையகம்" : "Headquarters"}</h3>
              <p>{headquartersAddress}</p>
            </div>
          </div>
          <div className="ts-info-item">
            <MapPin size={24} />
            <div>
              <h3>{isTa ? "அலுவலகம்" : "Office"}</h3>
              <p>{officeAddress}</p>
            </div>
          </div>
          <div className="ts-info-item">
            <Award size={24} />
            <div>
              <h3>{isTa ? "அரசுப் பதிவு" : "Accreditation"}</h3>
              <p>
                {isTa
                  ? "தமிழ்நாடு அரசு பதிவு பெற்றது | தமிழ் தற்காப்புக் கலை அறக்கட்டளை"
                  : "Registered under Tamil Nadu Societies / Tamil Martial Arts Trust"}
              </p>
            </div>
          </div>
          <div className="ts-info-item">
            <BookOpen size={24} />
            <div>
              <h3>{isTa ? "தலைமை ஆசான்" : "Chief Master"}</h3>
              <p>
                {isTa
                  ? "கலைச்சுடர்மணி ஆசான் தி. வீரபாண்டியன்\n(சிலம்ப வர்ம ஆசான்)"
                  : "Kalaisudarmani Asan T. Veerapandian\nMaster of Silambam & Varmam"}
              </p>
            </div>
          </div>
          <div className="ts-motto-callout">
            {isTa ? "பார்வை • இலக்கு • கவனம்" : "Vision • Target • Focus"}
          </div>
        </div>

        <div className="ts-card">
          <h2>{isTa ? "பொது வினவல் படிவம்" : "Send an Enquiry"}</h2>
          {sent ? (
            <div className="ts-receipt-card">
              <CheckCircle2 size={40} className="ts-success-icon" />
              <h3>{isTa ? "செய்தி பெறப்பட்டது!" : "Message Received!"}</h3>
              <p>
                {isTa
                  ? "உங்கள் வினவல் பதிவு செய்யப்பட்டுள்ளது. விரைவில் பதிலளிப்போம்."
                  : "Thank you for reaching out. A representative will get back to you shortly."}
              </p>
              {reference ? (
                <div className="ts-receipt-ref">
                  <span>{isTa ? "வினவல் குறிப்பு எண் (Reference):" : "Enquiry Reference ID:"}</span>
                  <strong>{reference}</strong>
                </div>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleContact} className="ts-form">
              {errorMessage ? (
                <div className="ts-form-error" role="alert">
                  {errorMessage}
                </div>
              ) : null}

              <div className="ts-field">
                <label htmlFor="c-name">{isTa ? "உங்கள் பெயர் *" : "Your Name *"}</label>
                <input
                  id="c-name"
                  required
                  type="text"
                  placeholder={isTa ? "பெயர்" : "Full Name"}
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                />
              </div>
              <div className="ts-field">
                <label htmlFor="c-email">{isTa ? "மின்னஞ்சல் முகவரி *" : "Email Address *"}</label>
                <input
                  id="c-email"
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                />
              </div>
              <div className="ts-field">
                <label htmlFor="c-phone">{isTa ? "கைபேசி எண் *" : "Phone Number *"}</label>
                <input
                  id="c-phone"
                  required
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={contactData.phone}
                  onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                />
              </div>
              <div className="ts-field">
                <label htmlFor="c-msg">{isTa ? "உங்கள் செய்தி *" : "Your Message *"}</label>
                <textarea
                  id="c-msg"
                  required
                  rows={4}
                  minLength={5}
                  placeholder={isTa ? "உங்கள் கேள்வியை எழுதவும்..." : "Write your query here..."}
                  value={contactData.message}
                  onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                />
              </div>

              <div className="ts-field ts-checkbox-field">
                <label htmlFor="c-consent" className="ts-checkbox-label">
                  <input
                    id="c-consent"
                    required
                    type="checkbox"
                    checked={contactData.consent}
                    onChange={(e) => setContactData({ ...contactData, consent: e.target.checked })}
                  />
                  <span>
                    {isTa
                      ? "எனது விவரங்களைச் சிவகலை குருகுல நிர்வாகம் தொடர்புகொள்வதற்காகப் பயன்படுத்த ஒப்புக்கொள்கிறேன். *"
                      : "I consent to Sivakalai Gurukulam processing my details to contact me regarding my enquiry. *"}
                  </span>
                </label>
              </div>

              <button type="submit" disabled={loading} className="ts-button ts-full-btn">
                {loading ? (isTa ? "அனுப்பப்படுகிறது..." : "Sending...") : (isTa ? "செய்தியை அனுப்பவும்" : "Send Message")}
              </button>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                                PRIVACY PAGE                                */
/* -------------------------------------------------------------------------- */
function PrivacyPage({ isTa }: { isTa: boolean; content: PageContent }) {
  return (
    <article className="ts-page ts-wrap ts-prose-page">
      <h1>{isTa ? "தகவல் பாதுகாப்பு & தனியுரிமைக் கொள்கை" : "Privacy Policy"}</h1>
      <p className="ts-lead">
        {isTa
          ? "சிவகலை குருகுலம் மற்றும் தென்காசி ஸ்போர்ட்ஸ் தளத்தில் மாணவர்கள் மற்றும் பெற்றோரின் விவரங்கள் பாதுகாக்கப்படும் விதம்."
          : "How student information and membership applications are handled with strict confidentiality at Sivakalai Gurukulam."}
      </p>

      <h2>{isTa ? "1. சேகரிக்கப்படும் தகவல்கள்" : "1. Information We Collect"}</h2>
      <p>
        {isTa
          ? "மாணவர் சேர்க்கை விண்ணப்பத்தின் போது பெயர், வயது, பாலினம், பெற்றோர் பெயர், தொலைபேசி எண், மின்னஞ்சல் மற்றும் வசிக்கும் பகுதி ஆகியவை மட்டுமே சேகரிக்கப்படுகின்றன. எக்காரணம் கொண்டும் தேவையற்ற வங்கி விவரங்களோ அந்தரங்க மருத்துவ ஆவணங்களோ கேட்கப்படுவதில்லை."
          : "When applying for membership, we collect essential student details such as full name, age, guardian details (for minors), contact number, and local town in Tenkasi district solely for admission processing and master allocations."}
      </p>

      <h2>{isTa ? "2. தகவல்களின் பயன்பாடு" : "2. Purpose of Use"}</h2>
      <p>
        {isTa
          ? "சேகரிக்கப்படும் தகவல்கள் மாணவர் சேர்க்கை, களப் பயிற்சி நேர ஒதுக்கீடு, பாதுகாப்பு விழிப்புணர்வு, போட்டிகளுக்கான பதிவுகள் மற்றும் ஆசானின் தொடர்புக்காக மட்டுமே பயன்படுத்தப்படும். எவ்வித மூன்றாம் நபர்களுக்கும் இந்த விவரங்கள் விற்கப்படவோ பகிரப்படவோ மாட்டாது."
          : "Collected information is strictly utilized for batch assignments, training schedules, emergency guardian contact, and tournament accreditation. Student data is never sold, leased, or shared with commercial marketers."}
      </p>

      <h2>{isTa ? "3. சிறார் பாதுகாப்பு" : "3. Protection of Minors"}</h2>
      <p>
        {isTa
          ? "18 வயதுக்குட்பட்ட மாணவர்களின் சேர்க்கைக்கு பெற்றோர் அல்லது காப்பாளரின் நேரடி ஒப்புதல் கட்டாயமாகும். மாணாக்கரின் புகைப்படங்கள் பெற்றோரின் இசைவு பெற்றே களப் பதிவுகளுக்காகப் பயன்படுத்தப்படும்."
          : "For students under 18 years of age, parental or guardian consent is mandatory prior to physical training enrollment. Visual images are published only with customary community consent."}
      </p>

      <h2>{isTa ? "4. பாதுகாப்பு மற்றும் சேமிப்பு" : "4. Data Security"}</h2>
      <p>
        {isTa
          ? "அனைத்து இணையப் படிவங்களும் பாதுகாப்பான SSL குறியாக்கத்தின் வழி CODEXSUN சர்வர் கட்டமைப்பிற்கு நேரடியாகப் பரிமாறப்படுகின்றன."
          : "All submissions travel via modern HTTPS encryption to the secured CODEXSUN platform registry without third-party tracking."}
      </p>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 TERMS PAGE                                 */
/* -------------------------------------------------------------------------- */
function TermsPage({ isTa }: { isTa: boolean; content: PageContent }) {
  return (
    <article className="ts-page ts-wrap ts-prose-page">
      <h1>{isTa ? "கள நெறிமுறைகளும் விதிகளும்" : "Terms & Arena Code of Conduct"}</h1>
      <p className="ts-lead">
        {isTa
          ? "வீரத்தமிழன் பாரம்பரிய சிவகலை குருகுலத்தின் களம் மற்றும் பயிற்சிகளுக்கான ஒழுங்கு நெறிகள்."
          : "The rules, discipline standards, and martial code of Veerathamilan Traditional Sivakalai Gurukulam."}
      </p>

      <h2>{isTa ? "1. கள ஒழுக்கம் & வணக்கம்" : "1. Arena Discipline & Salutation"}</h2>
      <p>
        {isTa
          ? "பயிற்சிக் களத்திற்குள் நுழையும் போதும் வெளியேறும் போதும் களத்திற்கும் ஆசானுக்கும் உரிய வணக்கத்தைச் செலுத்த வேண்டும். ஆசானின் உத்தரவுகளுக்கு மறுப்பின்றி கீழ்ப்படிவது சிலம்பத்தின் முதல் படியாகும்."
          : "Every student must bow in reverence to the arena (Kalam) and the master upon entering and departing. Punctuality, cleanliness, and attentiveness are non-negotiable."}
      </p>

      <h2>{isTa ? "2. கம்பிற்கு மரியாதை" : "2. Respect for the Weapon"}</h2>
      <p>
        {isTa
          ? "சிலம்பக் கம்பு என்பது வெறும் மரத்தடி அல்ல; அது தற்காப்புக் கடவுளாகக் கருதப்படுகிறது. கம்பை கால்களால் மிதிக்கவோ அவமதிக்கவோ கூடாது."
          : "The bamboo staff is treated with sacred reverence as an instrument of virtue and defense. It must never be kicked, trampled, or abused."}
      </p>

      <h2>{isTa ? "3. வன்முறை தவிர்த்தல்" : "3. Strict Non-Violence Outside Arena"}</h2>
      <p>
        {isTa
          ? "களத்தில் கற்ற வித்தையைக் கொண்டு பொது இடங்களில் சண்டையிடுவதோ, வீண் வம்பு செய்வதோ, எளியோரை அச்சுறுத்துவதோ முற்றிலுமாகத் தடை செய்யப்பட்டுள்ளது. தவறு செய்யும் மாணவர் உடனடியாக குருகுலத்திலிருந்து நீக்கப்படுவார்."
          : "Under no circumstances may students display weapons or initiate conflict in public spaces. Martial skill is consecrated solely to defense; violation warrants immediate expulsion."}
      </p>

      <h2>{isTa ? "4. உடை & சுகாதாரம்" : "4. Uniform & Hygiene"}</h2>
      <p>
        {isTa
          ? "நகங்களை வெட்டி, தூய்மையான பயிற்சி ஆடை அணிந்து வரவேண்டும். நகங்கள் நீளமாக இருந்தால் தற்காப்புப் பயிற்சியின் போது பிற மாணவர்களுக்குக் காயம் ஏற்பட வாய்ப்புண்டு."
          : "Fingernails must be clipped short and clean uniforms worn to prevent accidental scratches or lacerations during close-contact parries."}
      </p>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                               NOT FOUND PAGE                               */
/* -------------------------------------------------------------------------- */
function NotFoundPage({ isTa }: { isTa: boolean }) {
  return (
    <article className="ts-page ts-wrap ts-notfound">
      <div className="ts-404-card">
        <h1>404</h1>
        <h2>{isTa ? "பக்கம் கிடைக்கவில்லை" : "Page Not Found"}</h2>
        <p>
          {isTa
            ? "நீங்கள் தேடும் பக்கம் மாற்றப்பட்டிருக்கலாம் அல்லது நீக்கப்பட்டிருக்கலாம்."
            : "The page you are looking for does not exist or may have been moved."}
        </p>
        <div className="ts-nav-chips">
          <a href="/" className="ts-button">
            {isTa ? "முகப்புக்குச் செல்க" : "Go to Home"}
          </a>
          <a href="/syllabus" className="ts-pill">
            {isTa ? "பாடத்திட்டம்" : "Programs"} <ChevronRight size={14} />
          </a>
          <a href="/masters" className="ts-pill">
            {isTa ? "ஆசான் வரலாறு" : "Masters"} <ChevronRight size={14} />
          </a>
          <a href="/join" className="ts-pill">
            {isTa ? "சேர்க்கை" : "Join Club"} <ChevronRight size={14} />
          </a>
          <a href="/contact" className="ts-pill">
            {isTa ? "தொடர்பு" : "Contact"} <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </article>
  );
}
