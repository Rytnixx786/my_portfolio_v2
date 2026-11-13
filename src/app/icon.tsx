import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
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
          border: "2px solid #38BDF8",
          borderRadius: 14,
          color: "#E6EDF3",
          fontSize: 26,
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
