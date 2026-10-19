import { ArrowUpRight, BookOpen, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { sportsPortalUrl } from "./sports.links";

type ShowcaseProfile = {
  profile_id: string;
  display_name_en: string;
  display_name_ta: string;
  focus_en: string;
  focus_ta: string;
  image_panel: number;
};

function ShowcaseGrid({ audience, isTa }: { audience: "students" | "alumni"; isTa: boolean }) {
  const [profiles, setProfiles] = useState<ShowcaseProfile[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/community/showcase?audience=${audience}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Showcase unavailable");
        const body: unknown = await response.json();
        if (!body || typeof body !== "object" || !("data" in body) || !Array.isArray(body.data)) {
          throw new Error("Invalid showcase response");
        }
        setProfiles(body.data.filter((item: unknown): item is ShowcaseProfile =>
          !!item && typeof item === "object" &&
          "profile_id" in item && typeof item.profile_id === "string" &&
          "display_name_en" in item && typeof item.display_name_en === "string" &&
          "display_name_ta" in item && typeof item.display_name_ta === "string" &&
          "focus_en" in item && typeof item.focus_en === "string" &&
          "focus_ta" in item && typeof item.focus_ta === "string" &&
          "image_panel" in item && typeof item.image_panel === "number" && Number.isInteger(item.image_panel) &&
          item.image_panel >= 0 && item.image_panel <= 5
        ));
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [audience]);

  return (
    <section className="ts-showcase" aria-labelledby={`${audience}-showcase-title`}>
      <div className="ts-showcase-heading">
        <div>
          <span className="ts-badge">{isTa ? "மாதிரி அறிமுகங்கள்" : "Sample profiles"}</span>
          <h2 id={`${audience}-showcase-title`}>
            {audience === "students"
              ? (isTa ? "இளம் பயிற்சியாளர்கள்" : "Young learners")
              : (isTa ? "முன்னாள் மாணவர்கள்" : "Alumni community")}
          </h2>
        </div>
        <p>{isTa
          ? "இவை விளக்கத்திற்கான கற்பனை நபர்கள் மற்றும் படங்கள். உண்மையான உறுப்பினர்களின் பதிவுகள் அல்ல."
          : "Illustrative people and fictional profiles. These are not real club member records."}</p>
      </div>
      {status === "loading" && <p role="status">Loading sample portraits…</p>}
      {status === "error" && <p role="status">{isTa ? "மாதிரி படங்கள் தற்போது கிடைக்கவில்லை." : "Sample portraits are temporarily unavailable."}</p>}
      {status === "ready" && profiles.length === 0 && <p>{isTa ? "மாதிரி அறிமுகங்கள் இன்னும் இல்லை." : "No sample profiles are available yet."}</p>}
      {profiles.length > 0 && (
        <div className="ts-showcase-grid">
          {profiles.map((profile) => (
            <article className="ts-showcase-card" key={profile.profile_id}>
              <div className={`ts-showcase-photo ts-showcase-panel-${profile.image_panel}`} role="img"
                aria-label={isTa ? `${profile.display_name_ta} — விளக்கப் படம்` : `Illustrative portrait of ${profile.display_name_en}`} />
              <div className="ts-showcase-card-body">
                <span>{isTa ? "மாதிரி அறிமுகம்" : "Sample profile"}</span>
                <h3>{isTa ? profile.display_name_ta : profile.display_name_en}</h3>
                <p>{isTa ? profile.focus_ta : profile.focus_en}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function StudentsPage({ isTa }: { isTa: boolean }) {
  return (
    <article className="ts-page ts-wrap ts-community-page">
      <div className="ts-page-header">
        <span className="ts-badge">{isTa ? "மாணவர் வழிகாட்டி" : "Student guide"}</span>
        <h1>{isTa ? "மாணவர்கள்" : "Students"}</h1>
        <p className="ts-lead">
          {isTa
            ? "தென்காசி மாவட்ட விளையாட்டுக் கழகத்தின் தாயகமான சிவகலை குருகுலத்தில் பயிற்சி பெறும் மாணவர்களுக்கான வழிகள்."
            : "Training paths and account access for students of Tenkasi District Sports Club at its home association, Sivakalai Gurukulam."}
        </p>
      </div>
      <div className="ts-community-grid">
        <section className="ts-community-card">
          <BookOpen aria-hidden="true" size={28} />
          <h2>{isTa ? "பயிற்சியை அறிக" : "Explore training"}</h2>
          <p>{isTa ? "பாடத்திட்டம் மற்றும் வகுப்பு முறைகளைப் பாருங்கள்." : "Review the syllabus and class structure before joining."}</p>
          <a href="/syllabus">{isTa ? "பாடத்திட்டம்" : "View syllabus"} <ArrowUpRight size={16} /></a>
        </section>
        <section className="ts-community-card">
          <Users aria-hidden="true" size={28} />
          <h2>{isTa ? "மாணவர் சேர்க்கை" : "Become a student"}</h2>
          <p>{isTa ? "புதிய மாணவர் பதிவு செய்து, உறுதிப்படுத்தலைப் பெறுங்கள்." : "Apply for training and wait for confirmation from the club."}</p>
          <a href="/join">{isTa ? "சேர்க்கை படிவம்" : "Apply to join"} <ArrowUpRight size={16} /></a>
        </section>
      </div>
      <ShowcaseGrid audience="students" isTa={isTa} />
      <div className="ts-community-access">
        <h2>{isTa ? "ஏற்கெனவே உறுப்பினரா?" : "Already a member?"}</h2>
        <p>{isTa ? "உங்கள் மாணவர் கணக்கைப் பயன்படுத்தி பாதுகாப்பான போர்ட்டலில் உள்நுழையுங்கள்." : "Use your student account to sign in to the secure member portal."}</p>
        <a className="ts-button" href={sportsPortalUrl}>{isTa ? "மாணவர் போர்ட்டல்" : "Student portal"} <ArrowUpRight size={17} /></a>
      </div>
    </article>
  );
}

export function AlumniPage({ isTa }: { isTa: boolean }) {
  return (
    <article className="ts-page ts-wrap ts-community-page">
      <div className="ts-page-header">
        <span className="ts-badge">{isTa ? "குருகுல உறவு" : "Gurukulam community"}</span>
        <h1>{isTa ? "முன்னாள் மாணவர்கள்" : "Alumni"}</h1>
        <p className="ts-lead">
          {isTa
            ? "சிவகலை குருகுலத்தில் பயின்றவர்களும் தென்காசி மாவட்ட விளையாட்டுக் கழகத்துடன் தொடர்ந்தும் இணைந்திருக்கலாம்."
            : "Former students of Sivakalai Gurukulam can stay connected with Tenkasi District Sports Club."}
        </p>
      </div>
      <div className="ts-community-access">
        <h2>{isTa ? "மீண்டும் தொடர்பில் இணையுங்கள்" : "Stay connected"}</h2>
        <p>
          {isTa
            ? "பயிற்சி அனுபவங்கள், நிகழ்வுகள் அல்லது முன்னாள் மாணவர் தொடர்புக்காக எங்களுக்குச் செய்தி அனுப்புங்கள். உண்மையான முன்னாள் மாணவர் பட்டியல் வெளியிடப்படவில்லை."
            : "Contact the club about your training history, events, or alumni connections. A real alumni directory is not published."}
        </p>
        <a className="ts-button" href="/contact">{isTa ? "தொடர்பு கொள்ள" : "Contact the club"} <ArrowUpRight size={17} /></a>
      </div>
      <ShowcaseGrid audience="alumni" isTa={isTa} />
      <a className="ts-community-secondary" href="/gallery">
        {isTa ? "குருகுலப் படங்களைப் பாருங்கள்" : "See moments from the Gurukulam"} <ArrowUpRight size={16} />
      </a>
    </article>
  );
}
