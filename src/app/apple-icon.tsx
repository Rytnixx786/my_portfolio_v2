import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0D1117",
          border: "4px solid #38BDF8",
          borderRadius: 36,
          color: "#E6EDF3",
          fontSize: 74,
          fontWeight: 700,
          fontFamily: "sans-serif",
          letterSpacing: "-0.04em",
        }}
      >
        <span style={{ color: "#38BDF8" }}>M</span>
        <span>H</span>
      </div>
    ),
    { ...size }
  );
}

