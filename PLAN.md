# Portfolio v2 — Deep Compute & Interactive 3D Architecture Plan

**Owner:** Mehedi Hasan — AI & Backend Systems Engineer  
**Location:** `H:\Projects\My_Portfolio\portfolio-v2` (local workspace only; never pushed automatically to git)  
**Status:** Executed — **Deep Compute Interactive 3D Architecture** implemented across all sections and verified.

---

## 1. Visual Direction & Palette (Deep Compute)

| Layer | Token | Hex | Usage |
|---|---|---|---|
| Base Background (60%) | `--bg-base` | `#0D1117` | Low-fatigue obsidian viewport background |
| Elevated Surface (30%) | `--bg-surface` | `#161B22` | Slate cards, header, playground bays, command drawer |
| Recessed Core | `--bg-core` | `#1C222B` | Code panels, terminal prompts, bezel wells |
| Primary Ink | `--text-primary` | `#E6EDF3` | High-contrast soft off-white headlines & body |
| Secondary Ink | `--text-secondary` | `#8B949E` | Technical metadata, subtitles, descriptions |
| Muted Ink | `--text-muted` | `#6E7681` | Hairline labels, inactive controls |
| Primary Accent (10%) | `--accent` | `#38BDF8` | Electric cyan interactive borders, active pills, focal rings (`#7DD3FC` hover) |
| Semantic Telemetry | — | `#10B981` / `#F59E0B` / `#EF4444` | Strictly reserved for live health/latency/fault state indicators inside simulators & HUD |

## 2. Shared WebGL Performance & Quality Architecture

- **Global Provider (`WebGLContextProvider.tsx` + `device-tier.ts`):** Hardware-probed `auto | high | balanced | 2d` rendering tiers persisted to `sessionStorage` with automatic `prefers-reduced-motion` safety.
- **Interactive Quality HUD (`QualityToggleHUD.tsx`):** Floating bottom-right selector (`3D HIGH`, `3D BAL`, `2D SAFE`) allowing users to switch graphics fidelity cleanly at runtime.
- **Context-Budgeted Wrapper (`ViewportCanvas.tsx`):** Dual `IntersectionObserver` guard (`320px` proximity mount/unmount + `80px` `frameloop` pause) capping simultaneous live WebGL contexts cleanly (`<= 4`) to prevent Chrome WebGL context loss, paired with instant 2D DOM fallbacks.

## 3. Section-by-Section 3D & Interactive Modules

1. **Hero (`HeroEditorial.tsx`, `HeroInferenceCanvas.tsx`, `HeroOrbitalCore3D.tsx`, `FloatingProjectStack3D.tsx`)**
   - Full-bleed GLSL particle & wireframe lattice coupled to cursor depth and active flagship system.
   - Orbitable 3D `/img/newdp.jpg` shader-lit depth slab surrounded by three inclined telemetry rings and 4 clickable raycasted satellite nodes (`Cinch`, `Nexus`, `ARES`, `MindStack`) synchronized with the stacked project deck.
   - Streamlined 2-CTA strip (`Run 3D Simulator`, `Explore Case Studies`) with GSAP `SplitText` + `ScrambleTextPlugin`.
2. **Selected Work (`SelectedWorkSection.tsx`, `ProjectPreviewPlate.tsx`, `ProjectTopology3D.tsx`)**
   - `2D Stages | 3D Model` toggle on Tier-1 flagship architectures (`Cinch` stacked GPU shards + CPU bypass spline, `Nexus Researcher` 8-node directed graph, `ARES` 3D CI verification monoliths + 92% threshold plane).
3. **Systems Playground (`SystemsPlayground.tsx`, `PlaygroundPipeline3D.tsx`)**
   - Interactive 6-station 3D request/token routing diorama driven live by **Cinch Gateway** (`4.12ms` cache bypass loop, `331 tok/s` AWQ GPU spin, `45.56ms 503` physical mechanical breaker arm snap, `402` cutoff) and **NLI / RAG Gate** states, with smooth `Isometric | Top Schematic | Free Orbit` camera tweening.
4. **About / Manifesto (`AboutSection.tsx`, `PortraitShaderCanvas.tsx`)**
   - Cursor-reactive GLSL monochrome wave shader over `/img/mehedi-portrait.jpg` beside GSAP scroll-scrubbed manifesto typography.
5. **Expertise / Stack (`ExpertiseSection.tsx`, `StackRack3D.tsx`)**
   - Interactive 3D mechanical keycap matrix (`StackRack3D`) where clicking or hovering 3D hardware keys depresses keys physically and highlights matching layer tools.
6. **Experience & Lab (`ExperienceSection.tsx`, `ChronologyGyro3D.tsx`)**
   - Desktop GSAP `ScrollTrigger`-pinned header with a scroll-reactive 3D coordinate gyroscope (`2022 -> 2026`), verified proof cards, and Lab & Kernel archive.
7. **Case Studies `/work/[slug]` (`ArchitectureDiagram.tsx`, `ArchitectureDiagram3D.tsx`)**
   - Toggleable `2D Blueprint | 3D Spatial` DAG topology viewer with camera auto-focus on active stage nodes and streaming edge pulses.
8. **Footer / Contact (`ContactSection.tsx`, `TelemetryGlobe3D.tsx`, `AskTerminal.tsx`)**
   - Draggable 3D wireframe globe centered on Dhaka (`23.81° N, 90.41° E · UTC+6`) paired with the default-expanded AI portfolio terminal (`/api/query`).

## 4. Verification Summary

- Verified `@react-three/drei@^10.7.9` against `react@^19`, `@react-three/fiber@^9`, and `three@>=0.159`.
- Run `npx tsc --noEmit` and `npm run build` to confirm all 20 static/dynamic Next.js 16 routes compile cleanly.
- Verify HTTP 200 across `/`, `/work/[slug]`, `/img/newdp.jpg`, `/img/mehedi-portrait.jpg`, OG routes, and live `POST /api/query`.
