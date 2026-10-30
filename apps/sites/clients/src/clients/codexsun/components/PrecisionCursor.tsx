"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function PrecisionCursor() {
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-80);
  const y = useMotionValue(-80);
  const springX = useSpring(x, { stiffness: 520, damping: 42, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 520, damping: 42, mass: 0.4 });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduceMotion) return;

    const handleMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);

      const target = event.target;
      setActive(
        target instanceof Element &&
          Boolean(target.closest("a, button, input, textarea, .story-card"))
      );
    };

    const handleLeave = () => setVisible(false);

    window.addEventListener("mousemove", handleMove);
    document.documentElement.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
    };
  }, [x, y]);

  return (
    <motion.div
      className={`precision-cursor ${active ? "is-active" : ""} ${visible ? "is-visible" : ""}`}
      style={{ x: springX, y: springY }}
      aria-hidden="true"
    />
  );
}
