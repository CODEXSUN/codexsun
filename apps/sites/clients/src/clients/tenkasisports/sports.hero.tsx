import { ArrowLeft, ArrowRight, ArrowUpRight, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const slides = [
  {
    eyebrow: { ta: "சிவகலை குருகுலம் · தென்காசி", en: "Sivakalai Gurukulam · Tenkasi" },
    title: { ta: "தென்காசி மாவட்ட விளையாட்டுக் கழகம்", en: "Tenkasi District Sports Club" },
    description: {
      ta: "சிலம்பம், ஒழுக்கம் மற்றும் தற்காப்பைப் படிப்படியாகக் கற்கும் பயிற்சிக் களம்.",
      en: "A place to learn Silambam, discipline, and self-defense through steady practice."
    },
    image: "/gallery-stance-4.webp",
    imageAlt: { ta: "சிலம்பக் கம்புடன் பயிற்சி பெறும் மாணவி", en: "Student practicing with a Silambam staff" },
    caption: { ta: "சிலம்பப் பயிற்சி", en: "Silambam practice" },
    action: { href: "/join", ta: "பயிற்சியில் இணையுங்கள்", en: "Join training" }
  },
  {
    eyebrow: { ta: "மாணவர்களின் பயணம்", en: "The student journey" },
    title: { ta: "அடிப்படையிலிருந்து திறமை வரை", en: "From first stance to steady skill" },
    description: {
      ta: "நிலைகள், கம்பு பிடிப்பு மற்றும் அசைவுகளை முறையாகக் கற்கும் பாடத்திட்டம்.",
      en: "Explore a syllabus that builds from stances and staff handling to confident movement."
    },
    image: "/gallery-stance-5.webp",
    imageAlt: { ta: "சிலம்பப் பயிற்சியில் மாணவி", en: "Student holding a staff during Silambam practice" },
    caption: { ta: "படிப்படியான கற்றல்", en: "Progressive learning" },
    action: { href: "/syllabus", ta: "பாடத்திட்டம் காண்க", en: "View syllabus" }
  },
  {
    eyebrow: { ta: "ஆசான் வழிகாட்டல்", en: "Guided by the master" },
    title: { ta: "மரபுடன் தொடரும் பயிற்சி", en: "Training rooted in tradition" },
    description: {
      ta: "ஆசான் தி. வீரபாண்டியன் வழிகாட்டலில் குருகுல மரபை அறிந்து பயிற்சி பெறுங்கள்.",
      en: "Learn about the Gurukulam's teaching tradition and Master T. Veerapandian."
    },
    image: "/asan-portrait.webp",
    imageAlt: { ta: "ஆசான் தி. வீரபாண்டியன் உருவப்படம்", en: "Portrait of Master T. Veerapandian" },
    caption: { ta: "ஆசான் தி. வீரபாண்டியன்", en: "Master T. Veerapandian" },
    action: { href: "/masters", ta: "ஆசான்களை அறிக", en: "Meet the masters" }
  }
] as const;

export function SportsHero({ isTa }: { isTa: boolean }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const slide = slides[activeSlide] ?? slides[0];
  const language = isTa ? "ta" : "en";

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setTimeout(() => {
      setHasChanged(true);
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [activeSlide, paused, reduceMotion]);

  function showRelativeSlide(offset: number) {
    setHasChanged(true);
    setActiveSlide((current) => (current + offset + slides.length) % slides.length);
  }

  function finishTouch(x: number, y: number) {
    const start = touchStart.current;
    touchStart.current = null;
    setPaused(false);
    if (!start) return;
    const deltaX = x - start.x;
    const deltaY = y - start.y;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    showRelativeSlide(deltaX < 0 ? 1 : -1);
  }

  return (
    <section
      className="ts-hero ts-wrap"
      aria-label={isTa ? "கழக அறிமுகக் காட்சிகள்" : "Club highlights"}
      aria-roledescription="carousel"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onFocus={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => {
        const touch = event.touches.item(0);
        if (!touch) return;
        touchStart.current = { x: touch.clientX, y: touch.clientY };
        setPaused(true);
      }}
      onTouchEnd={(event) => {
        const touch = event.changedTouches.item(0);
        if (touch) finishTouch(touch.clientX, touch.clientY);
      }}
      onTouchCancel={() => {
        touchStart.current = null;
        setPaused(false);
      }}
    >
      <div className="ts-hero-copy">
        <div className="ts-hero-slide-copy" aria-live="polite" aria-atomic="true">
            <div
              className={hasChanged ? "ts-hero-message ts-slide-enter" : "ts-hero-message"}
              key={activeSlide}
            >
              <span className="ts-hero-badge"><Shield size={15} aria-hidden="true" /> {slide.eyebrow[language]}</span>
              <h1 className="ts-hero-title">{slide.title[language]}</h1>
              <p className="ts-hero-intro">{slide.description[language]}</p>
              <div className="ts-hero-actions">
                <a className="ts-button ts-hero-main-btn" href={slide.action.href}>
                  {slide.action[language]} <ArrowUpRight size={18} aria-hidden="true" />
                </a>
                <a className="ts-hero-secondary" href="/about">{isTa ? "கழகத்தைப் பற்றி" : "About the club"}</a>
              </div>
            </div>
        </div>
        <div className="ts-hero-footer">
          <div className="ts-hero-controls">
            <button type="button" className="ts-hero-arrow" aria-label={isTa ? "முந்தைய காட்சி" : "Previous slide"} onClick={() => showRelativeSlide(-1)}><ArrowLeft size={18} /></button>
            <div className="ts-hero-dots" aria-label={isTa ? "காட்சியைத் தேர்ந்தெடுக்கவும்" : "Choose a slide"}>
              {slides.map((item, index) => (
                <button
                  type="button"
                  key={item.image}
                  aria-current={index === activeSlide ? "true" : undefined}
                  aria-label={`${isTa ? "காட்சி" : "Slide"} ${index + 1}: ${item.title[language]}`}
                  onClick={() => {
                    setHasChanged(true);
                    setActiveSlide(index);
                  }}
                />
              ))}
            </div>
            <button type="button" className="ts-hero-arrow" aria-label={isTa ? "அடுத்த காட்சி" : "Next slide"} onClick={() => showRelativeSlide(1)}><ArrowRight size={18} /></button>
          </div>
        </div>
      </div>
      <div className="ts-hero-stage">
          <figure
            className={hasChanged ? "ts-hero-media ts-slide-enter" : "ts-hero-media"}
            key={slide.image}
          >
            <img src={slide.image} alt={slide.imageAlt[language]} fetchPriority={activeSlide === 0 ? "high" : undefined} decoding="async" />
            <figcaption>{slide.caption[language]}</figcaption>
          </figure>
      </div>
    </section>
  );
}
