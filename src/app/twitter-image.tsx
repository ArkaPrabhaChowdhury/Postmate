import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Postmate - Turn GitHub commits into LinkedIn posts in seconds.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #090909 0%, #111111 70%, #161616 100%)",
          color: "#f0ede8",
          padding: "56px 64px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#d4ff00",
              color: "#090909",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 30,
            }}
          >
            P
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>Postmate</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 980 }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.05 }}>
            Turn GitHub commits into polished posts.
          </div>
          <div style={{ fontSize: 32, color: "#b5b3ad", lineHeight: 1.2 }}>
            Built for developers who publish consistently on LinkedIn and X.
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#d4ff00", fontWeight: 600 }}>postmate.arkocodes.dev</div>
      </div>
    ),
    size,
  );
}

