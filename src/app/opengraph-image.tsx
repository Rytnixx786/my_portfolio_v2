import { ImageResponse } from "next/og";
import { profile } from "@/data/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          backgroundColor: "#0D1117",
          color: "#E6EDF3",
          border: "1px solid rgba(240,246,252,0.12)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#38BDF8",
            fontFamily: "monospace",
          }}
        >
          <span>{profile.role}</span>
          <span style={{ color: "#8B949E" }}>DHAKA · UTC+6</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 20,
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 0.94,
              letterSpacing: "-0.03em",
              color: "#E6EDF3",
            }}
          >
            <span>MEHEDI</span>
            <span style={{ color: "#38BDF8" }}>HASAN</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.38,
              color: "#8B949E",
              maxWidth: 880,
            }}
          >
            <span>{profile.thesis}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(240,246,252,0.12)",
            paddingTop: 24,
            fontSize: 18,
            color: "#8B949E",
            fontFamily: "monospace",
          }}
        >
          <span>10.86× vLLM · 4.12 ms cache · 91% refusal · 95% grounded</span>
          <span style={{ color: "#38BDF8" }}>{profile.status}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
