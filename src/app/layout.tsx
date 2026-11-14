import type { Metadata, Viewport } from "next";
import {
  Antonio,
  Instrument_Serif,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { profile } from "@/data/site";
import { LenisProvider } from "@/components/chrome/LenisProvider";
import { Navbar } from "@/components/chrome/Navbar";
import { CommandPalette } from "@/components/chrome/CommandPalette";
import { Footer } from "@/components/chrome/Footer";
import { WebGLContextProvider } from "@/components/canvas/WebGLContextProvider";
import { QualityToggleHUD } from "@/components/canvas/QualityToggleHUD";
import "./globals.css";

const antonio = Antonio({
  subsets: ["latin"],
  variable: "--font-antonio",
  display: "swap",
  preload: true,
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
  preload: false,
});

const siteTitle = `${profile.name} - ${profile.role}`;
const siteDescription =
  "AI & Backend Systems Engineer in Dhaka. I build the deterministic systems around stochastic models: quantized LLM serving gateways, stateful LangGraph orchestration, grounded hybrid RAG, and CI-gated ML promotion.";

export const metadata: Metadata = {
  metadataBase: new URL(profile.url),
  title: {
    default: siteTitle,
    template: `%s - ${profile.name}`,
  },
  description: siteDescription,
  authors: [{ name: profile.name }],
  creator: profile.name,
  alternates: {
    canonical: profile.url,
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "Mehedi Hasan",
    "AI Systems Engineer",
    "Backend Engineer",
    "vLLM",
    "LangGraph",
    "FastAPI",
    "RAG",
    "MLOps",
    "Cinch",
    "Nexus Researcher",
    "ARES",
  ],
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    siteName: siteTitle,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D1117",
  viewportFit: "cover",
};

const personId = `${profile.url}/#person`;
const websiteId = `${profile.url}/#website`;

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": personId,
  name: profile.name,
  givenName: profile.first,
  familyName: profile.last,
  jobTitle: profile.role,
  url: profile.url,
  image: `${profile.url}${profile.portrait}`,
  email: `mailto:${profile.email}`,
  sameAs: [profile.github, profile.linkedin],
  knowsAbout: [
    "vLLM",
    "AWQ Marlin Quantization",
    "LangGraph",
    "FastAPI",
    "Hybrid RAG",
    "PostgreSQL Row-Level Security",
    "MLOps CI Gates",
    "ONNX Runtime",
  ],
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "BRAC University",
    sameAs: "https://www.bracu.ac.bd",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dhaka",
    addressCountry: "Bangladesh",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": websiteId,
  name: siteTitle,
  url: profile.url,
  publisher: { "@id": personId },
  author: { "@id": personId },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${antonio.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([personJsonLd, websiteJsonLd]),
          }}
        />
      </head>
      <body className="min-h-[100dvh] bg-[#0D1117] text-[#E6EDF3] font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[#38BDF8] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#0D1117]"
        >
          Skip to content
        </a>
        <div className="paper-grain" aria-hidden="true" />
        <WebGLContextProvider>
          <LenisProvider>
            <Navbar />
            <CommandPalette />
            <main id="main-content" className="w-full max-w-full overflow-x-clip">
              {children}
            </main>
            <Footer />
            <QualityToggleHUD />
          </LenisProvider>
        </WebGLContextProvider>
      </body>
    </html>
  );
}
