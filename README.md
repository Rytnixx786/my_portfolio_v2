# Portfolio v2 - Mehedi Hasan

Engineering portfolio and interactive architecture workbench built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, GSAP ScrollTrigger, Shiki, and a single-context React Three Fiber (`<View.Port />`) 3D system.

## Architecture Highlights

- **Single Root WebGL Canvas**: `Scene3DRoot` mounts one `<Canvas frameloop="demand">` via `next/dynamic({ ssr: false })` only when hardware WebGL passes capability detection (`0 KB` Three.js in the initial non-3D bundle), using `@react-three/drei`'s `<View.Port />` and `@react-three/postprocessing` selective Bloom.
- **Grounded Query Engine & Streaming API (`/api/query`)**: Deterministic word-boundary local index paired with optional Gemini 2.5 Flash synthesis over `x-goog-api-key`, 8s timeout, IP rate limiting (`429 Retry-After`), 2 KB input guard, and progressive SSE streaming.
- **Server-Highlighted Case Studies (`/work/[slug]`)**: Static pre-rendered case studies using Shiki (`github-dark-default`), baseline-vs-engineered quantitative comparisons, interactive 2D/3D stage diagrams, `SoftwareSourceCode` / `BreadcrumbList` JSON-LD, and dynamic OG images.
- **Recruiter Brief & Tooling Routes (`/brief`, `/uses`)**: Printable one-page hiring summary and stack breakdown.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Verification Scripts

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

