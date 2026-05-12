import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";
export const runtime = "edge";

export default function Icon() {
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
            justifyContent: "center",
            color: "#1c1a17",
            lineHeight: 1,
          }}
        >
          <div
            style={{
              fontSize: 320,
              fontStyle: "italic",
              fontWeight: 500,
              letterSpacing: "-0.04em",
            }}
          >
            L
          </div>
          <div
            style={{
              marginTop: 28,
              height: 2,
              width: 220,
              background: "#1c1a17",
              opacity: 0.5,
            }}
          />
          <div
            style={{
              marginTop: 14,
              fontSize: 44,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#1c1a17",
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
