import { useRef, useState, useEffect, useId, type CSSProperties } from "react";
import { useInView } from "framer-motion";
import { Package, Workflow, ShieldCheck, Truck, Layers, ClipboardList, Gauge, Sparkles, MessageSquare, Users, FileText, Check, Globe, Share2, Inbox, CircleDot, Pause, Play } from "lucide-react";
import "./logicx-workflow-board.css";

const stepIcons = {
  "Receive & identify lots": Package, "Plan processing": Workflow, "Record quality": ShieldCheck, "Prepare dispatch": Truck,
  "Allocate yarn": Layers, "Assign loom or knitting jobs": ClipboardList, "Record output": Gauge, "Review finishing": Sparkles,
  "Capture the enquiry": MessageSquare, "Assign & follow up": Users, "Send a quotation": FileText, "Confirm the order": Check,
  "Publish your story": Globe, "Connect social profiles": Share2, "Capture enquiries": Inbox, "Review & improve": Gauge
};

export function LogicxWorkflowBoard({ steps, title, variant = 0 }: { steps: string[]; title: string; variant?: number }) {
  const gradientId = useId().replace(/:/g, "");
  const neon = ["#60a5fa", "#b48aff", "#fbbf24", "#34edb0"];
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.2 });
  const [paused, setPaused] = useState(false);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const rows = Math.ceil(steps.length / 2);
  const height = Math.max(1, rows) * 140;
  const points = steps.map((_, index) => {
    const row = Math.floor(index / 2);
    const column = row % 2 ? 1 - index % 2 : index % 2;
    return { x: width * (column ? 0.75 : 0.25), y: row * 140 + 70 };
  });
  return (
    <div ref={ref} className={`lx-flow-board lx-flow-neon lx-flow-pattern-${variant % 4} ${visible && !paused ? "lx-flow-running" : ""}`}>
      <div className="lx-flow-toolbar">
        <button type="button" onClick={() => setPaused(!paused)} aria-label={`${paused ? "Play" : "Pause"} animation: ${title}`} title={paused ? "Play animation" : "Pause animation"}>
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      </div>
      <div className="lx-flow-canvas" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {points.slice(0, -1).map((point, index) => {
            const next = points[index + 1]!;
            const direction = next.x >= point.x ? 1 : -1;
            const startX = point.x + direction * 27;
            const endX = next.x - direction * 27;
            const path = point.y === next.y
              ? variant % 2
                ? `M${startX} ${point.y} C${startX + direction * 30} ${point.y - 32} ${endX - direction * 30} ${next.y - 32} ${endX} ${next.y}`
                : `M${startX} ${point.y} H${endX}`
              : variant % 4 === 2
                ? `M${point.x - 27} ${point.y} C${width * 0.42} ${point.y} ${width * 0.42} ${next.y} ${next.x - 27} ${next.y}`
                : `M${point.x + 27} ${point.y} C${Math.min(width - 8, point.x + 70)} ${point.y} ${Math.min(width - 8, next.x + 70)} ${next.y} ${next.x + 27} ${next.y}`;
            return <g key={index}>
              <defs><linearGradient id={`${gradientId}-${index}`} gradientUnits="userSpaceOnUse" x1={point.x} y1={point.y} x2={next.x === point.x ? next.x + 1 : next.x} y2={next.y}>
                <stop stopColor={neon[index % neon.length]} />
                <stop offset="1" stopColor={neon[(index + 1) % neon.length]} />
              </linearGradient></defs>
              <path className="lx-flow-track" d={path} />
              <path className="lx-flow-beam" d={path} pathLength="1" stroke={`url(#${gradientId}-${index})`} style={{ "--beam-delay": `${-index * 0.85}s`, "--beam-duration": `${3 + variant * 0.4}s` } as CSSProperties} />
            </g>;
          })}
        </svg>
        <ol aria-label={`${title} steps`}>
          {steps.map((step, index) => {
            const point = points[index]!;
            const Icon = stepIcons[step as keyof typeof stepIcons] ?? CircleDot;
            return <li key={`${index}-${step}`} style={{ left: `${point.x / width * 100}%`, top: point.y, "--node-neon": neon[index % neon.length] } as CSSProperties}>
              <div className="lx-flow-node"><Icon size={22} aria-hidden="true" /><span>{String(index + 1).padStart(2, "0")}</span></div>
              <span className="lx-flow-label">{step}</span>
            </li>;
          })}
        </ol>
      </div>
      <p className="lx-flow-caption">Illustrative process</p>
    </div>
  );
}
