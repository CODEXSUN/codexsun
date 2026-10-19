import { ArrowUpRight, BookOpen, Users } from "lucide-react";
import { sportsPortalUrl } from "./sports.links";

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
            ? "பயிற்சி அனுபவங்கள், நிகழ்வுகள் அல்லது முன்னாள் மாணவர் தொடர்புக்காக எங்களுக்குச் செய்தி அனுப்புங்கள். முன்னாள் மாணவர் பட்டியல் வெளியிடப்படவில்லை."
            : "Contact the club about your training history, events, or alumni connections. No public alumni directory is available yet."}
        </p>
        <a className="ts-button" href="/contact">{isTa ? "தொடர்பு கொள்ள" : "Contact the club"} <ArrowUpRight size={17} /></a>
      </div>
      <a className="ts-community-secondary" href="/gallery">
        {isTa ? "குருகுலப் படங்களைப் பாருங்கள்" : "See moments from the Gurukulam"} <ArrowUpRight size={16} />
      </a>
    </article>
  );
}
