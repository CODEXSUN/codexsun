import { ArrowLeft, ArrowUpRight } from "lucide-react";

interface SportsArticle {
  slug: string;
  image: string;
  imageAlt: string;
  categoryTa: string;
  categoryEn: string;
  titleTa: string;
  titleEn: string;
  summaryTa: string;
  summaryEn: string;
  bodyTa: string[];
  bodyEn: string[];
}

export const sportsArticles: SportsArticle[] = [
  {
    slug: "silambam-first-steps",
    image: "/gallery-stance-1.webp",
    imageAlt: "Silambam student practising a starting stance",
    categoryTa: "பயிற்சி",
    categoryEn: "Training",
    titleTa: "சிலம்பப் பயிற்சியின் முதல் படிகள்",
    titleEn: "The first steps in Silambam",
    summaryTa: "சமநிலை, பிரிவு நிலை, சாண் பிடி ஆகியவற்றிலிருந்து பயிற்சி தொடங்குகிறது.",
    summaryEn: "Training begins with balance, the ready stance and the traditional staff grip.",
    bodyTa: [
      "சிலம்பத்தில் வேகத்தை விட அடிப்படை நிலைகளின் தெளிவே முக்கியம். சமநிலையில் உடலை நிமிர்த்தி, கவனத்தை ஒருமுகப்படுத்திக் கொள்கிறோம். பிரிவு நிலை அடுத்த அசைவுக்குத் தயாராக உதவுகிறது.",
      "சாண் பிடி முறையில் கம்பின் அளவையும் பிடிக்கும் இடத்தையும் அறிந்த பிறகு, ஆசான் வழிகாட்டலில் முன்வீச்சு, வெட்டு, வாரல் ஆகிய அடிப்படை அசைவுகளைப் பயிலலாம்."
    ],
    bodyEn: [
      "Silambam begins with clear foundations. Samanilai develops an upright, attentive posture, while Pirivu Nilai prepares the body for movement.",
      "Students then learn how to measure and hold the staff with the Saan Pidi grip before practising basic swings and cuts under a master's guidance."
    ]
  },
  {
    slug: "three-level-syllabus",
    image: "/gallery-stance-2.webp",
    imageAlt: "Ready stance during Silambam training",
    categoryTa: "பாடத்திட்டம்",
    categoryEn: "Syllabus",
    titleTa: "மூன்று நிலைகளில் ஒரு பயிற்சிப் பயணம்",
    titleEn: "A training journey in three levels",
    summaryTa: "ஆரம்பம் முதல் உயர்நிலை வரை ஒவ்வொரு கட்டமும் முந்தைய பயிற்சியை வளர்க்கிறது.",
    summaryEn: "Each level builds on the skills learned in the one before it.",
    bodyTa: [
      "ஆரம்ப நிலையில் உடல் சமநிலை, கம்பு பிடித்தல், அடிப்படை வீச்சுகள் ஆகியவற்றில் கவனம் செலுத்தப்படுகிறது. இடைநிலையில் சுவடு முறைகள், சதுரச் சுவடி, சவுக்கு வீச்சு ஆகியவை சேர்கின்றன.",
      "உயர்நிலைப் பயிற்சியில் சிக்கலான அசைவுகளும் வர்மக்கலை பற்றிய அறிமுகமும் ஆசான் மேற்பார்வையில் கற்பிக்கப்படுகின்றன. ஒவ்வொரு மாணவரும் தன் திறனுக்கும் பாதுகாப்புக்கும் ஏற்ற வேகத்தில் முன்னேறுகிறார்."
    ],
    bodyEn: [
      "The beginner level focuses on posture, grip and basic staff movements. Intermediate training adds footwork patterns, Sadura Suvadi and faster strikes.",
      "Advanced practice introduces more complex movements and Varmam knowledge under direct supervision. Students progress at a pace suited to their ability and safety."
    ]
  },
  {
    slug: "guru-student-tradition",
    image: "/asan-temple-staff.webp",
    imageAlt: "Master T. Veerapandian holding a Silambam staff",
    categoryTa: "மரபு",
    categoryEn: "Tradition",
    titleTa: "ஆசான் வழியில் தொடரும் கலை",
    titleEn: "Keeping the art alive through mentorship",
    summaryTa: "குருகுல மரபில் பயிற்சியுடன் ஒழுக்கமும் பொறுப்பும் இணைகின்றன.",
    summaryEn: "The Gurukulam tradition brings discipline and responsibility into training.",
    bodyTa: [
      "சிவகலை குருகுலத்தில் ஆசான் வழிகாட்டல் பயிற்சியின் மையமாக உள்ளது. மாணவர் அசைவுகளை மட்டும் பின்பற்றாமல், கவனம், கட்டுப்பாடு, சக மாணவர்களுக்கான மரியாதை ஆகியவற்றையும் வளர்த்துக் கொள்கிறார்.",
      "தென்காசி மாவட்ட விளையாட்டுக் கழகம் இந்த மரபை புதிய மாணவர்களுடன் பகிர்ந்து, கற்ற அறிவை அடுத்த தலைமுறைக்குக் கொண்டு செல்ல முயல்கிறது."
    ],
    bodyEn: [
      "At Sivakalai Gurukulam, the master's guidance is central to practice. Students learn movements alongside focus, self-control and respect for fellow learners.",
      "Tenkasi District Sports Club shares this tradition with new students so that the knowledge can continue across generations."
    ]
  },
  {
    slug: "safe-practice",
    image: "/gallery-stance-4.webp",
    imageAlt: "Silambam staff movement in a training arena",
    categoryTa: "பாதுகாப்பு",
    categoryEn: "Safety",
    titleTa: "பாதுகாப்புடன் சிலம்பம் பயில்வது",
    titleEn: "Practising Silambam safely",
    summaryTa: "இடைவெளி, உடற்பயிற்சி, ஆசான் மேற்பார்வை ஆகியவை களத்தின் அடிப்படை.",
    summaryEn: "Spacing, warm-up and supervision make every practice session safer.",
    bodyTa: [
      "கம்பைப் பயன்படுத்தும் முன் உடலைத் தயார் செய்யும் பயிற்சி அவசியம். களத்தில் மற்றவர்களுடன் போதிய இடைவெளி வைத்துக் கொண்டு, சுற்றியுள்ளவர்களை கவனித்த பிறகே அசைவுகளைத் தொடங்க வேண்டும்.",
      "புதிய அல்லது உயர்நிலை அசைவுகளை ஆசான் நேரடி வழிகாட்டலில் மட்டுமே பயில வேண்டும். பாதுகாப்பு என்பது கற்றலின் ஒரு பகுதியாகவே இருக்கிறது."
    ],
    bodyEn: [
      "A warm-up prepares the body before staff practice. Students keep enough distance from others and check the space around them before moving.",
      "New and advanced movements belong under direct instruction. Safe habits are part of learning the art itself."
    ]
  },
  {
    slug: "training-ground-moments",
    image: "/gallery-stance-5.webp",
    imageAlt: "Open ground Silambam practice",
    categoryTa: "களக் காட்சிகள்",
    categoryEn: "From the arena",
    titleTa: "களத்தில் உருவாகும் கற்றல்",
    titleEn: "Learning on the training ground",
    summaryTa: "ஒவ்வொரு பயிற்சியிலும் கவனம், மீண்டும் முயற்சி, கூட்டுப் பயிற்சி வளர்கின்றன.",
    summaryEn: "Each session gives students room to focus, repeat and learn together.",
    bodyTa: [
      "திறந்தவெளிக் களத்தில் மாணவர்கள் அடிப்படை நிலைகளை மீண்டும் மீண்டும் பயில்கிறார்கள். ஒரே அசைவைக் கவனமாகத் திருத்திப் பயில்வது, அடுத்த கட்டத்திற்கான நம்பிக்கையை உருவாக்குகிறது.",
      "படத்தொகுப்பில் பயிற்சி நிலைகள் மற்றும் குருகுலக் களத் தருணங்களைப் பார்க்கலாம். பயிற்சியில் இணைய விரும்புவோர் வகுப்புகள் மற்றும் சேர்க்கைப் பக்கங்களில் விவரங்களை அறியலாம்."
    ],
    bodyEn: [
      "On the training ground, students return to foundational stances again and again. Careful repetition builds confidence for the next level.",
      "The gallery shows training positions and moments from the Gurukulam arena. Visitors can explore the classes and admission pages to learn how to join."
    ]
  }
];

export function SportsBlogPreview({ isTa }: { isTa: boolean }) {
  return (
    <section className="ts-section ts-wrap ts-blog-section">
      <div className="ts-section-header">
        <div>
          <span className="ts-eyebrow">05 / {isTa ? "குருகுலக் குறிப்புகள்" : "From the Gurukulam"}</span>
          <h2>{isTa ? "கலையையும் பயிற்சியையும் அறிக" : "Stories from the training ground"}</h2>
        </div>
        <a className="ts-text-link" href="/blogs">
          {isTa ? "அனைத்து கட்டுரைகள்" : "View all articles"} <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="ts-blog-grid">
        {sportsArticles.map((article) => <SportsBlogCard key={article.slug} article={article} isTa={isTa} />)}
      </div>
    </section>
  );
}

export function SportsBlogPages({ path, isTa }: { path: string; isTa: boolean }) {
  if (path === "/blogs") {
    return (
      <article className="ts-page ts-wrap">
        <div className="ts-page-header">
          <span className="ts-badge">{isTa ? "குருகுலக் குறிப்புகள்" : "Gurukulam Journal"}</span>
          <h1>{isTa ? "பயிற்சிக் கட்டுரைகள்" : "Training articles"}</h1>
          <p className="ts-lead">
            {isTa ? "சிலம்பம், குருகுல மரபு, பாதுகாப்பான பயிற்சி பற்றிய குறிப்புகள்." : "Notes on Silambam, Gurukulam tradition and safe practice."}
          </p>
        </div>
        <div className="ts-blog-grid ts-blog-list">
          {sportsArticles.map((article) => <SportsBlogCard key={article.slug} article={article} isTa={isTa} />)}
        </div>
      </article>
    );
  }

  const article = sportsArticles.find((item) => path === `/blogs/${item.slug}`);
  if (!article) return null;
  return (
    <article className="ts-page ts-wrap ts-blog-article">
      <a className="ts-blog-back" href="/blogs"><ArrowLeft size={17} /> {isTa ? "கட்டுரைகள்" : "All articles"}</a>
      <div className="ts-page-header">
        <span className="ts-badge">{isTa ? article.categoryTa : article.categoryEn}</span>
        <h1>{isTa ? article.titleTa : article.titleEn}</h1>
        <p className="ts-lead">{isTa ? article.summaryTa : article.summaryEn}</p>
      </div>
      <img className="ts-blog-hero-image" src={article.image} alt={article.imageAlt} width={1100} height={570} decoding="async" />
      <div className="ts-blog-body">
        {(isTa ? article.bodyTa : article.bodyEn).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <a className="ts-text-link" href="/gallery">
          {isTa ? "படத்தொகுப்பைக் காண்க" : "Explore the gallery"} <ArrowUpRight size={17} />
        </a>
      </div>
    </article>
  );
}

function SportsBlogCard({ article, isTa }: { article: SportsArticle; isTa: boolean }) {
  return (
    <a className="ts-blog-card" href={`/blogs/${article.slug}`}>
      <img src={article.image} alt="" loading="lazy" decoding="async" width={420} height={230} />
      <span className="ts-blog-card-content">
        <span className="ts-blog-category">{isTa ? article.categoryTa : article.categoryEn}</span>
        <strong>{isTa ? article.titleTa : article.titleEn}</strong>
        <span className="ts-blog-summary">{isTa ? article.summaryTa : article.summaryEn}</span>
        <span className="ts-blog-read">{isTa ? "மேலும் படிக்க" : "Read article"} <ArrowUpRight size={16} /></span>
      </span>
    </a>
  );
}
