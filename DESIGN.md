# Design System: Mehedi Hasan — Deep Compute Studio

## 1. Visual Theme & Atmosphere
- **Mood:** A high-craft dark systems studio inspired by modern AI telemetry workspaces, IDE architecture graphs, and editorial monograph layouts.
- **Density:** 4/10 (Gallery-Structured) on editorial sections; 6/10 (Instrument Precision) inside interactive topology plates and telemetry simulators.
- **Variance:** 8/10 (Offset asymmetric splits, left-pinned experience choreography, interleaved 3D stack & live WebGL particle lattice).
- **Motion:** 7/10 (Smooth Lenis scroll synced with GSAP `ScrollTrigger` pinning/scrubbing, `SplitText` reveals, `ScrambleTextPlugin` telemetry counters, spring tactile physics — with instant `prefers-reduced-motion` fallbacks).

## 2. Color Palette & Roles (Deep Compute)
- **Obsidian Base (60%):** `#0D1117` (`--bg-canvas`) — Primary background surface. Never pure `#000000`.
- **Slate Card (30%):** `#161B22` (`--bg-surface`) — Elevated panels, navigation shells, cards (+5% brightness separation over base canvas).
- **Recessed Compute Well:** `#1C222B` (`--bg-surface-muted`) — Double-Bezel core wells, code blocks, terminal stream logs, SVG canvases.
- **Soft Bone Ink:** `#E6EDF3` (`--ink-primary`) — Primary headlines, labels, strong body highlights (soft desaturated off-white to prevent halation).
- **Muted Slate:** `#8B949E` (`--ink-secondary`) — Body descriptions, technical context (`max-w-[65ch]`).
- **Dim Graphite:** `#6E7681` (`--ink-muted`) — Line counts, indices, dividers, metadata labels.
- **Electric Cyan (10% Single Accent):** `#38BDF8` (`--accent-primary`) — Active pipeline nodes, focus rings, primary CTAs, WebGL energy pulses. Hover tint: `#7DD3FC`. Soft wash: `rgba(56, 189, 248, 0.12)`.
- **Structural Hairline:** `rgba(240, 246, 252, 0.10)` (`--border-hairline`) — Crisp 1px architectural dividers and outer Double-Bezel frames.
- **Functional Telemetry Signals Only (Not Decorative):**
  - Healthy / Cache Hit / CI Pass: `#10B981`
  - Latency / Warning / Half-Open Canary: `#F59E0B`
  - Circuit Open / HTTP 402 / Fault: `#EF4444`

## 3. Typography Rules
- **Display Condensed:** `Antonio` — Uppercase compressed authority (`-0.025em` tracking, tight `0.90` leading).
- **Editorial Contrast Detail:** `Instrument Serif` (`weight: 400`, normal/italic) — Contrasting lowercase editorial accents inside headings.
- **UI / Body Sans:** `Plus Jakarta Sans` — Crisp body prose, `max-w-[65ch]`, relaxed `1.65`–`1.75` line-height.
- **Telemetry / Code Mono:** `JetBrains Mono` — `tabular-nums`, latency readouts, node indices, command palette, simulator JSON.
- **Banned:** `Inter`, generic system defaults, `#000000`, light/white full washes, green brand themes, `#A855F7` decorative purple/indigo neon glows.

## 4. Component & Layout Contracts
- **Double-Bezel Enclosures:** Outer shell (`#161B22` / `rgba(240,246,252,0.08)` ring) stepping inward to recessed core (`#1C222B` / `#161B22`) with top highlight edge (`inset 0 1px 0 rgba(240,246,252,0.06)`).
- **Buttons:** Tactile Button-in-Button trailing icon badges with magnetic spring pull on pointer hover and `active:scale-[0.98]`.
- **Hero Stage:** `min-h-[100dvh]`, WebGL `HeroInferenceCanvas`, `/img/newdp.jpg` portrait in obsidian double-bezel with `#38BDF8` orbital ring, synced `FloatingProjectStack3D`.
- **Interactive Modules:** `TelemetryMarquee`, interactive `ProjectPreviewPlate` stage inspector, `SystemsPlayground` (Cinch Gateway & MindStack/Nexus NLI live routing simulator), scroll-pinned `ExperienceSection`, and global `Cmd/Ctrl + K` `CommandPalette` wired to `/api/query`.

