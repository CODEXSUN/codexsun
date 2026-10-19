import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 12000, suffix: "+", ta: "பயின்ற மாணவர்கள்", en: "Students trained" },
  { value: 2000, suffix: "", ta: "பயிற்சி தொடங்கிய ஆண்டு", en: "Training since" },
  { value: 64, suffix: "+", ta: "பாடத்திட்டக் கூறுகள்", en: "Syllabus topics" },
  { value: 132, suffix: "+", ta: "தனித்துவமான நுட்பங்கள்", en: "Unique techniques" }
] as const;

function formatStat(value: number, target: number) {
  const rounded = Math.round(value);
  return target === 2000 ? String(rounded) : rounded.toLocaleString("en-IN");
}

function AnimatedStat({ stat, index, visible, isTa }: {
  stat: (typeof stats)[number];
  index: number;
  visible: boolean;
  isTa: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(stat.value);
      return;
    }

    let frame = 0;
    const duration = 1400;
    const delay = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(stat.value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, index * 120);
    return () => {
      window.clearTimeout(delay);
      cancelAnimationFrame(frame);
    };
  }, [index, stat.value, visible]);

  return (
    <div className="ts-stat-item">
      <strong aria-label={`${formatStat(stat.value, stat.value)}${stat.suffix}`}>
        <span aria-hidden="true">{formatStat(value, stat.value)}{stat.suffix}</span>
      </strong>
      <span>{isTa ? stat.ta : stat.en}</span>
    </div>
  );
}

export function SportsStats({ isTa }: { isTa: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="ts-hero-facts ts-wrap" aria-label={isTa ? "கழகத் தகவல்கள்" : "Club facts"}>
      {stats.map((stat, index) => <AnimatedStat key={stat.value} stat={stat} index={index} visible={visible} isTa={isTa} />)}
    </section>
  );
}
