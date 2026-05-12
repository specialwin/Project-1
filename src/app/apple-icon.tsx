import { ImageResponse } from "next/og";

// Apple touch icon — iOS uses 180×180 and applies its own mask/rounding.
// We render with a solid background so the rounded corners stay clean.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "edge";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f7f3ec",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "#1c1a17",
            lineHeight: 1,
          }}
        >
          <div
            style={{
              fontSize: 124,
              fontStyle: "italic",
              fontWeight: 500,
              letterSpacing: "-0.04em",
            }}
          >
            L
          </div>
          <div
            style={{
              marginTop: 10,
              height: 1,
              width: 80,
              background: "#1c1a17",
              opacity: 0.5,
            }}
          />
          <div
            style={{
              marginTop: 6,
              fontSize: 14,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            Lineup
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
