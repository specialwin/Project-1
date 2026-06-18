import { ImageResponse } from "next/og";

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
        }}
      >
        <div style={{ display: "flex", position: "relative" }}>
          <div
            style={{
              width: 96,
              height: 32,
              background: "#7a1f1f",
              position: "absolute",
              top: 32,
              left: 0,
            }}
          />
          <div
            style={{
              width: 32,
              height: 96,
              background: "#7a1f1f",
              position: "absolute",
              top: 0,
              left: 32,
            }}
          />
          <div style={{ width: 96, height: 96 }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
