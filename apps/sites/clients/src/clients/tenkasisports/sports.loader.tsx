interface SportsLoaderProps {
  inline?: boolean;
  label?: string;
}

export function SportsLoader({ inline = false, label = "Preparing your Silambam experience…" }: SportsLoaderProps) {

  return (
    <span className={inline ? "ts-loader ts-loader-inline" : "ts-loader"} role="status" aria-live="polite">
      <span className="ts-loader-mark" aria-hidden="true">
        <svg className="ts-loader-staff" viewBox="0 0 112 36" focusable="false">
          <g transform="rotate(-12 56 18)">
            <rect x="12" y="13" width="88" height="10" rx="5" fill="#61331e" stroke="#392018" strokeWidth="1.2" />
            <path d="M27 15.5h57M30 20.5h52" stroke="#ad6840" strokeWidth="1.1" strokeLinecap="round" opacity=".9" />
            <path d="M43 14.5l8 7m9-7 8 7" stroke="#f2b64d" strokeWidth=".8" opacity=".7" />
            <rect x="9" y="11" width="18" height="14" rx="4" fill="#e5a626" stroke="#8e4c12" strokeWidth="1.2" />
            <rect x="85" y="11" width="18" height="14" rx="4" fill="#e5a626" stroke="#8e4c12" strokeWidth="1.2" />
            <path d="M14 13v10m4-10v10m4-10v10M90 13v10m4-10v10m4-10v10" stroke="#fff1ae" strokeWidth="1.2" opacity=".85" />
            <path d="M27 12v12m3-11v10m52-10v10m3-11v12" stroke="#f9d66b" strokeWidth="1.8" />
            <path d="M53 13v10m6-10v10" stroke="#a12224" strokeWidth="2" opacity=".9" />
          </g>
        </svg>
      </span>
      <span className="ts-loader-label">{label}</span>
    </span>
  );
}
