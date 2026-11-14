# Design System: Mehedi Hasan — Deep Compute Studio

## 1. Visual Theme & Atmosphere
- **Mood:** High-craft dark systems engineering workspace combining IDE telemetry precision with clean editorial typography.
- **Density:** 4/10 (Gallery-Structured) across editorial bands; 6/10 (Instrument Precision) inside interactive topology views and pipeline controls.
- **Variance:** 8/10 (AIDA chapter progression: asymmetric 2-line Hero + orbital core -> gapless 12-col Selected Work Bento -> interactive Systems Simulator -> desktop-pinned editorial bio & timeline -> tactile 3D Stack rack -> grounded Contact & Ask console).
- **Motion:** 7/10 (Single-ticker Lenis smooth scroll synced with GSAP 3.15 `ScrollTrigger`, `SplitText` masked line reveals guarded by `document.fonts.ready`, single-pass `ScrambleTextPlugin` telemetry decoding, and scrubbed SVG `stroke-dashoffset` traces — honoring live `prefers-reduced-motion` static states).

## 2. Color Palette & Roles
- **Obsidian Base (60%):** `#0D1117` (`--bg-canvas`) — Primary background surface. Never `#000000`.
- **Slate Surface (30%):** `#161B22` (`--bg-surface`) — Elevated panels, navigation shells, Double-Bezel frames.
- **Recessed Compute Well:** `#1C222B` (`--bg-surface-muted`) — Inner bezel wells, code blocks, terminal logs, diagram canvases.
- **Soft Bone Ink:** `#E6EDF3` (`--ink-primary`) — Primary headlines, labels, strong body contrast.
- **Secondary Body Ink:** `#9DA7B3` (`--ink-secondary`) — Prose body copy (`max-w-[65ch]`).
- **Accessible Muted Ink:** `#8B949E` (`--color-muted` / `--ink-muted`) — Metadata, axis labels, indices (`>= 4.5:1` AA contrast; legacy `#6E7681` eliminated).
- **Single Global UI Accent (`<80%` Saturation):** `#38BDF8` (`--accent-primary`) — Primary CTAs, active nav highlight, focus rings, UI links. Hover tint: `#7DD3FC`. Soft wash: `rgba(56, 189, 248, 0.12)`.
- **Semantic Category Palette (`src/lib/palette.ts` via `culori` OKLCH, zero purple):** Scoped strictly to project cards, architecture diagrams, Stack layers, and 3D node encoding (`Inference & Serving` sky `#6EC3EE`, `Agents & RAG` rose `#F29BBB`, `MLOps & Security` lime `#B4D67A`, `Mobile & Systems` apricot `#F2B47F`).
- **Telemetry States (Simulator & Diagrams Only):** Healthy `#10B981`, Warning/Latency `#F59E0B`, Fault/Blocked `#EF4444` (always paired with text/status badge).

## 3. Typography & Ergonomic Floors
- **Display Condensed:** `Antonio` — Uppercase compressed authority (`-0.02em` tracking, `0.90–0.96` leading).
- **Editorial Accent Detail:** `Instrument Serif` (italic, `400`) — Restrained lowercase accent inside selected display headlines.
- **UI & Body Sans:** `Plus Jakarta Sans` — Crisp prose (`max-w-[65ch]`, relaxed `1.65` line-height).
- **Telemetry & Code Mono:** `JetBrains Mono` — `tabular-nums`, latency metrics, stage telemetry, command palette, JSON payloads.
- **12px Minimum Floor:** All visible HTML, SVG, and canvas-overlay UI copy enforces `>= 12px` (`text-xs`) legibility.
- **44px Interactive Floor:** All clickable UI buttons, keycaps, HUD triggers, and beacons enforce `>= 44px` minimum hit targets.

## 4. Component, WebGL & Scroll Contracts
- **Compositor-Locked 3D Slot Pool (`ViewportCanvas.tsx` + `WebGLContextProvider.tsx`):** Container-scoped `<Canvas>` instances governed by an LRU active pool (`maxSlots: 3` high / `2` mid) with intersection hysteresis, single session-cached GPU capability probe (`WEBGL_lose_context` cleanup), live `prefers-reduced-motion` subscription, and full 2D SVG/DOM parity (`2D SAFE` / `webglcontextlost`).
- **Active Scene Set:** `HeroOrbitalCore3D`, `ProjectTopology3D`, `PlaygroundPipeline3D`, `StackRack3D` (tactile layer switchboard with neighbor wave ripple & keyboard sync), `TelemetryGlobe3D`, and case-study `ArchitectureDiagram3D`.
- **Interactive Modules:** `HeroCursorField`, gapless `SelectedWorkSection` Bento, `SystemsPlayground` (with live Stage Inspector & telemetry payload), merged `AboutSection` narrative + timeline, `CommandPalette` (`<dialog>` + `/api/query`), collapsed `AskTerminal`, and standalone `/brief` & `/uses` routes.
