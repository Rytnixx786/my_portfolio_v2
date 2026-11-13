# portfolio-v2 Design & Engineering Rules

1. **Color Palette & Dark Engineering Surface System**
   - Never revert to an all-white / light-cream wash (`#F7F7F4`, `#FFFFFF`) or white-and-emerald-green (`#087F62`) theme.
   - Use **Deep Compute** dark-mode engineering tokens: `#0D1117` obsidian canvas (60%), `#161B22` elevated slate surface (30%), `#1C222B` recessed core for bezels/code blocks, `#E6EDF3` soft off-white primary text, `#8B949E` desaturated slate metadata, and `#38BDF8` Electric Cyan as the **single primary accent** (10%) for active nodes, primary CTAs, and focus states.
   - Avoid pure `#000000` on large surfaces (prevents halation) and create depth by stepping background brightness up 4%–8% rather than heavy drop shadows.
   - Reserve `#10B981` (healthy), `#F59E0B` (latency/warning), and `#EF4444` (circuit-open/failed) strictly for functional telemetry state signals inside simulators and status indicators. Do not use `#A855F7` purple/violet gradients or AI neon glows.

2. **Interactivity & Motion Standard**
   - Do not ship static showcase blocks when interactive engineering alternatives fit the workflow.
   - Actively leverage the installed graphics & motion stack (`three` / `@react-three/fiber`, `gsap` `ScrollTrigger` pinning/scrubbing + `SplitText` + `ScrambleTextPlugin`, `lenis`, and View Transitions) with instant `prefers-reduced-motion` fallbacks.
   - Keep interactive elements grounded in Mehedi Hasan's real AI & backend engineering artifacts (interactive pipeline node explorers, live request-routing / NLI telemetry simulators, `Cmd/Ctrl+K` command console wired to `/api/query`).

3. **Data & Visual Asset Integrity**
   - Preserve 100% authentic resume, repository, and benchmark metrics (`Cinch`, `Nexus Researcher`, `ARES`, `MindStack`, `OFFBoarder`, `MaSheba AI`, `FlyRank`, `BRAC University`, `SimpleFS`, `xv6`, `3D CCTA`).
   - Use authentic portrait assets in `public/img/` (`/img/newdp.jpg` and `/img/mehedi-portrait.jpg`) cleanly without clipping or distorted aspect ratios.
   - Never invent client testimonials, awards, fake percentages, or skill progress bars.

4. **Technical & Scope Guardrails**
   - Stay inside `H:\Projects\My_Portfolio\portfolio-v2` when writing project code (parent files in `H:\Projects\My_Portfolio` are read-only sources).
   - Never run `git push` automatically.
   - **Next.js 16 Turbopack Fonts:** Never pass a `weight` array to variable `next/font/google` imports (omit `weight` on variable fonts; use single `"400"` on non-variable fonts).
   - **Satori OG Routes:** Every `<div>` with more than one child in `opengraph-image.tsx` must specify `display: "flex"`.

