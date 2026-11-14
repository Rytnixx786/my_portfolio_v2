"use client";

import { HERO_ORBIT_HUES } from "@/lib/palette";

interface HeroOrbitalBootSilhouetteProps {
  className?: string;
}

/**
 * Geometric wireframe orbital silhouette rendered during dynamic chunk and WebGL boot.
 * Intentionally omits any <img> portrait element so only one portrait asset request fires.
 */
export function HeroOrbitalBootSilhouette({
  className = "h-full w-full",
}: HeroOrbitalBootSilhouetteProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] ${className}`}
      style={{
        background:
          "radial-gradient(circle at 50% 48%, rgba(56,189,248,0.09) 0%, rgba(13,17,23,0.98) 70%)",
      }}
    >
      {/* Top-left wireframe chip silhouette aligned with HeroOrbitalCore3D HUD */}
      <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/85 px-3 py-1 font-mono text-xs text-[#8B949E]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#38BDF8]" />
        <span className="text-[#9DA7B3]">01 Cinch</span>
        <span className="hidden text-[#8B949E] sm:inline">· 331 tok/s</span>
      </div>

      {/* Concentric Orbital Wireframe & Center Enclosure Outline */}
      <svg
        viewBox="0 0 440 360"
        className="h-full w-full max-h-[420px] select-none"
      >
        <defs>
          <radialGradient id="boot-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="220" cy="180" r="132" fill="url(#boot-core-glow)" />

        {/* Subtle corner reticle marks */}
        <g stroke="rgba(240,246,252,0.12)" strokeWidth="1">
          <path d="M 24 44 L 24 30 L 38 30" fill="none" />
          <path d="M 416 44 L 416 30 L 402 30" fill="none" />
          <path d="M 24 316 L 24 330 L 38 330" fill="none" />
          <path d="M 416 316 L 416 330 L 402 330" fill="none" />
        </g>

        {/* Outer + inner tilted orbital tracks matching HeroOrbital2DFallback */}
        <g transform="translate(220 194) rotate(-10)">
          <ellipse
            cx="0"
            cy="0"
            rx="186"
            ry="76"
            fill="none"
            stroke="#38BDF8"
            strokeOpacity="0.26"
            strokeWidth="1.25"
            strokeDasharray="6 6"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="154"
            ry="58"
            fill="none"
            stroke="rgba(240,246,252,0.14)"
            strokeWidth="1"
          />
        </g>

        {/* Central Portrait Enclosure Wireframe (no portrait img) */}
        <rect
          x="148"
          y="72"
          width="144"
          height="196"
          rx="18"
          fill="#161B22"
          fillOpacity="0.72"
          stroke="rgba(56,189,248,0.28)"
          strokeWidth="1.25"
        />
        <rect
          x="158"
          y="82"
          width="124"
          height="176"
          rx="12"
          fill="none"
          stroke="rgba(240,246,252,0.08)"
          strokeWidth="1"
        />
        {/* Minimal wireframe silhouette bust lines inside enclosure */}
        <circle
          cx="220"
          cy="138"
          r="22"
          fill="none"
          stroke="rgba(56,189,248,0.22)"
          strokeWidth="1.2"
        />
        <path
          d="M 182 224 C 184 188, 256 188, 258 224"
          fill="none"
          stroke="rgba(56,189,248,0.18)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Static orbital anchor nodes tinted with the 4 flagship hues */}
        <circle cx="386" cy="212" r="5" fill={HERO_ORBIT_HUES[0]} fillOpacity="0.8" />
        <circle cx="96" cy="242" r="4" fill={HERO_ORBIT_HUES[1]} fillOpacity="0.65" />
        <circle cx="88" cy="146" r="4" fill={HERO_ORBIT_HUES[2]} fillOpacity="0.6" />
        <circle cx="338" cy="130" r="4" fill={HERO_ORBIT_HUES[3]} fillOpacity="0.6" />
      </svg>
    </div>
  );
}
