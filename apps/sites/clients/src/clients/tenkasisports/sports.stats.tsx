import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  { value: 6000, suffix: "+", ta: "பயின்ற மாணவர்கள்", en: "Students trained" },
  { value: 2006, suffix: "", ta: "பயிற்சி தொடங்கிய ஆண்டு", en: "Training since" },
  { value: 3, suffix: "", ta: "பாடத்திட்ட நிலைகள்", en: "Syllabus levels" },
  { value: 108, suffix: "", ta: "வர்மப் புள்ளிகள்", en: "Varmam points" }
] as const;

function formatStat(value: number, target: number) {
  const rounded = Math.round(value);
  return target === 2006 ? String(rounded) : rounded.toLocaleString("en-IN");
}

function AnimatedStat({ stat, index, visible, isTa }: {
  stat: (typeof stats)[number];
  index: number;
  visible: boolean;
  isTa: boolean;
}) {
  const count = useMotionValue(0);
  const display = useTransform(count, (value) => formatStat(value, stat.value));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      count.set(stat.value);
      return;
    }
    if (!visible) return;

    const animation = animate(count, stat.value, {
      duration: 1.8,
      delay: index * 0.14,
      ease: [0.22, 1, 0.36, 1]
    });
    return () => animation.stop();
  }, [count, index, reduceMotion, stat.value, visible]);

  return (
    <motion.div
      className="ts-stat-item"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={visible ? { opacity: 1, y: 0 } : false}
      transition={{ duration: reduceMotion ? 0 : 0.55, delay: index * 0.12 }}
    >
      <strong aria-label={`${formatStat(stat.value, stat.value)}${stat.suffix}`}>
        <motion.span aria-hidden="true">{display}</motion.span><span aria-hidden="true">{stat.suffix}</span>
      </strong>
      <span>{isTa ? stat.ta : stat.en}</span>
    </motion.div>
  );
}

export function SportsStats({ isTa }: { isTa: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.35 });

  return (
    <section ref={ref} className="ts-hero-facts ts-wrap" aria-label={isTa ? "கழகத் தகவல்கள்" : "Club facts"}>
      {stats.map((stat, index) => <AnimatedStat key={stat.value} stat={stat} index={index} visible={visible} isTa={isTa} />)}
    </section>
  );
}
