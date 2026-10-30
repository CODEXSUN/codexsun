"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { HeroMessage } from "../public.constants";
import heroVideo from "../assets/hero/codexsun-cinematic-home.mp4";
import heroPoster from "../assets/hero/codexsun-cinematic-poster.jpg";

const VIDEO_END_PROGRESS = 0.92;
const MESSAGE_INTERVAL_MS = 6000;

export default function HeroSection({
  heroTitle,
  messages
}: {
  heroTitle: string;
  messages: readonly HeroMessage[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const introHiddenRef = useRef(false);
  const finalFlashRef = useRef(false);
  const gatewayReleasedRef = useRef(false);
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const [introHidden, setIntroHidden] = useState(false);
  const [finalFlash, setFinalFlash] = useState(false);
  const [gatewayReleased, setGatewayReleased] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  const introY = useTransform(scrollYProgress, [0, 0.025, 0.055], [0, -8, -18]);
  const titleGlow = useTransform(scrollYProgress, [0, 0.02, 0.05], [0.18, 0.24, 0]);

  const architectureX = useTransform(scrollYProgress, [0, 0.62, 0.84], [0, -18, -58]);
  const architectureScale = useTransform(scrollYProgress, [0, 0.62, 0.84], [1, 1.035, 1.12]);
  const videoScale = useTransform(scrollYProgress, [0, 0.45, 0.92, 1], [1.03, 1.07, 1.12, 1.16]);
  const videoX = useTransform(scrollYProgress, [0, 0.62, 1], [0, -10, -24]);
  const videoY = useTransform(scrollYProgress, [0, 0.7, 1], [0, -6, -12]);

  const titleStyle = reduceMotion
    ? {}
    : {
        y: introY,
        "--energy": titleGlow
      };

  useEffect(() => {
    if (reduceMotion || messages.length < 2) return undefined;

    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, MESSAGE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [messages.length, reduceMotion]);

  useEffect(() => {
    const updateScrollState = () => {
      const section = sectionRef.current;
      if (!section) return;

      const scrollableDistance = Math.max(1, section.offsetHeight - window.innerHeight);
      const rawProgress = -section.getBoundingClientRect().top / scrollableDistance;
      const progress = Math.min(1, Math.max(0, rawProgress));
      const shouldHideIntro = progress > 0.006;
      if (shouldHideIntro !== introHiddenRef.current) {
        introHiddenRef.current = shouldHideIntro;
        setIntroHidden(shouldHideIntro);
      }

      const shouldFlash = rawProgress >= VIDEO_END_PROGRESS && rawProgress < 0.995;
      if (shouldFlash !== finalFlashRef.current) {
        finalFlashRef.current = shouldFlash;
        setFinalFlash(shouldFlash);
      }

      const shouldReleaseGateway = rawProgress >= 0.995;
      if (shouldReleaseGateway !== gatewayReleasedRef.current) {
        gatewayReleasedRef.current = shouldReleaseGateway;
        setGatewayReleased(shouldReleaseGateway);
      }
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || reduceMotion) return undefined;

    const getStickyProgress = () => {
      const section = sectionRef.current;
      if (!section) return 0;

      const scrollableDistance = Math.max(1, section.offsetHeight - window.innerHeight);
      return Math.min(1, Math.max(0, -section.getBoundingClientRect().top / scrollableDistance));
    };

    const tick = () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 8;
      const target = Math.min(duration - 0.035, Math.max(0, targetTimeRef.current));
      const current = currentTimeRef.current || video.currentTime || 0;
      const delta = target - current;
      const next = Math.abs(delta) < 0.018 ? target : current + delta * 0.36;

      currentTimeRef.current = next;

      try {
        video.currentTime = next;
      } catch {
        // Some browsers briefly reject seeks before metadata is ready.
      }

      frameRef.current =
        Math.abs(target - next) < 0.018 ? null : window.requestAnimationFrame(tick);
    };

    const requestSmoothSeek = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(tick);
      }
    };

    const setVideoTime = (progress: number) => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 8;
      const videoProgress = Math.min(1, Math.max(0, progress / VIDEO_END_PROGRESS));
      targetTimeRef.current = Math.min(
        duration - 0.035,
        Math.max(0, videoProgress * (duration - 0.07))
      );

      if (videoProgress >= 0.995) {
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }

        currentTimeRef.current = targetTimeRef.current;
        try {
          video.currentTime = targetTimeRef.current;
        } catch {
          // Some browsers briefly reject seeks before metadata is ready.
        }
        return;
      }

      requestSmoothSeek();
    };

    const handleMetadata = () => {
      video.pause();
      currentTimeRef.current = video.currentTime || 0;
      setVideoTime(getStickyProgress());
    };

    const handleScroll = () => setVideoTime(getStickyProgress());

    video.muted = true;
    video.pause();
    video.addEventListener("loadedmetadata", handleMetadata);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    if (video.readyState >= 1) handleMetadata();

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadata);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [reduceMotion]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className={`cinema-home relative h-[340vh] w-full bg-[#efeee9] text-carbon ${gatewayReleased ? "is-gateway-released" : ""}`}
    >
      <div className="cinema-sticky sticky top-0 min-h-screen overflow-hidden">
        <motion.div
          className="cinema-architecture"
          {...(reduceMotion
            ? {}
            : {
                style: {
                  x: architectureX,
                  scale: architectureScale
                }
              })}
          aria-hidden="true"
        />
        <motion.div
          className="cinema-video-frame"
          {...(reduceMotion
            ? {}
            : {
                style: {
                  scale: videoScale,
                  x: videoX,
                  y: videoY
                }
              })}
          aria-hidden="true"
        >
          <video
            ref={videoRef}
            className="cinema-video"
            src={heroVideo}
            poster={heroPoster}
            muted
            playsInline
            preload="auto"
          />
          <div className="cinema-video-grade" />
        </motion.div>
        <div className="cinema-vignette" aria-hidden="true" />

        <motion.a
          href="#contact"
          className={`cinema-start-link cinema-intro-ui absolute right-8 top-8 z-30 hidden items-center gap-4 text-[12px] font-semibold text-frost lg:flex ${introHidden ? "is-hidden" : ""}`}
        >
          Start a project
          <span className="grid h-9 w-9 place-items-center rounded-full border border-frost/70">
            &rarr;
          </span>
        </motion.a>
        <motion.a
          href="#approach"
          className={`cinema-explore-link cinema-intro-ui ${introHidden ? "is-hidden" : ""}`}
          {...(!reduceMotion
            ? {
                animate: {
                  y: [0, -3, 0],
                  opacity: [0.72, 1, 0.72],
                  textShadow: [
                    "0 0 6px rgba(245,245,245,0.12)",
                    "0 0 24px rgba(245,245,245,0.5)",
                    "0 0 6px rgba(245,245,245,0.12)"
                  ]
                }
              }
            : {})}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          Explore
          <br />
          Our Process
        </motion.a>

        <motion.div
          className={`cinema-copy cinema-intro-ui pointer-events-none absolute z-20 ${introHidden ? "is-hidden" : ""}`}
          style={titleStyle}
        >
          <h1 className="energy-title font-display uppercase leading-[0.84] text-carbon">
            {heroTitle.split("\n").map((line, index) => (
              <span key={line} className={index === 2 ? "clarity-line" : undefined}>
                {line}
              </span>
            ))}
          </h1>
          <div className="cinema-rule" />
          <div className="mt-7 min-h-[150px] max-w-[370px] overflow-hidden" aria-live="off">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={messageIndex}
                className="text-[13px] leading-[1.75] text-carbon/76"
                {...(reduceMotion
                  ? { initial: false }
                  : {
                      initial: { opacity: 0, y: 10, filter: "blur(4px)" },
                      exit: { opacity: 0, y: -8, filter: "blur(3px)" }
                    })}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <strong className="mb-2 block text-[14px] font-semibold leading-[1.45] text-carbon">
                  {messages[messageIndex]?.title}
                </strong>
                <span>{messages[messageIndex]?.description}</span>
              </motion.p>
            </AnimatePresence>
          </div>
          <a
            href="#work"
            className="pointer-events-auto mt-10 inline-flex items-center gap-4 border-b border-carbon pb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-carbon"
          >
            See our work
            <span>&rarr;</span>
          </a>
        </motion.div>

        <motion.div
          className={`portal-wash ${finalFlash ? "is-final-active" : ""}`}
          aria-hidden="true"
        />
        <motion.div
          className={`portal-flash ${finalFlash ? "is-final-active" : ""}`}
          aria-hidden="true"
        />

        <motion.a
          href="#work"
          className={`scroll-cue cinema-intro-ui ${introHidden ? "is-hidden" : ""}`}
        >
          <span className="scroll-mouse">
            <span />
          </span>
          <span>Scroll</span>
        </motion.a>
      </div>
    </section>
  );
}
