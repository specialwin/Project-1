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
            color: "#7a1f1f",
            lineHeight: 1,
          }}
        >
          {/* กากบาทเครื่องหมายการแพทย์ */}
          <div style={{ display: "flex", position: "relative" }}>
            <div
              style={{
                width: 260,
                height: 86,
                background: "#7a1f1f",
                position: "absolute",
                top: 87,
                left: 0,
              }}
            />
            <div
              style={{
                width: 86,
                height: 260,
                background: "#7a1f1f",
                position: "absolute",
                top: 0,
                left: 87,
              }}
            />
            <div style={{ width: 260, height: 260 }} />
          </div>
          <div
            style={{
              marginTop: 40,
              fontSize: 56,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#1c1a17",
            }}
          >
            StockYa
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
