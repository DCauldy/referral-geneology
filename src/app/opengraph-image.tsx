import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const alt = "Trellis — Grow Your Referral Network";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(
  family: string,
  weight: number
): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
    {
      headers: {
        // Use older Safari UA to get TTF format (Satori doesn't support WOFF2)
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    }
  ).then((r) => r.text());

  const url = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1];
  if (!url) throw new Error(`Font not found: ${family}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

export default async function Image() {
  const [libreBold, interMedium] = await Promise.all([
    loadFont("Libre Baskerville", 700),
    loadFont("Inter", 500),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, #2f5435 0%, #1a311e 100%)",
          position: "relative",
        }}
      >
        {/* Network Trellis Logo */}
        <svg width={120} height={120} viewBox="0 0 48 48" fill="none">
          <line
            x1="24"
            y1="6"
            x2="12"
            y2="18"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <line
            x1="24"
            y1="6"
            x2="36"
            y2="18"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <line
            x1="12"
            y1="18"
            x2="8"
            y2="32"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <line
            x1="12"
            y1="18"
            x2="24"
            y2="32"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <line
            x1="36"
            y1="18"
            x2="24"
            y2="32"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <line
            x1="36"
            y1="18"
            x2="40"
            y2="32"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <line
            x1="8"
            y1="32"
            x2="16"
            y2="42"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <line
            x1="24"
            y1="32"
            x2="16"
            y2="42"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <line
            x1="24"
            y1="32"
            x2="32"
            y2="42"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <line
            x1="40"
            y1="32"
            x2="32"
            y2="42"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <line
            x1="12"
            y1="18"
            x2="36"
            y2="18"
            stroke="#ffffff"
            strokeWidth="1"
            opacity={0.3}
          />
          <line
            x1="8"
            y1="32"
            x2="40"
            y2="32"
            stroke="#ffffff"
            strokeWidth="1"
            opacity={0.3}
          />
          <circle
            cx={24}
            cy={6}
            r={3.5}
            fill="#5d8a5a"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <circle
            cx={12}
            cy={18}
            r={3}
            fill="#96b593"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <circle
            cx={36}
            cy={18}
            r={3}
            fill="#96b593"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <circle
            cx={8}
            cy={32}
            r={2.5}
            fill="#c4a96a"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <circle
            cx={24}
            cy={32}
            r={3}
            fill="#96b593"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <circle
            cx={40}
            cy={32}
            r={2.5}
            fill="#c4a96a"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <circle
            cx={16}
            cy={42}
            r={2.5}
            fill="#b09352"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <circle
            cx={32}
            cy={42}
            r={2.5}
            fill="#b09352"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
        </svg>

        {/* Wordmark */}
        <div
          style={{
            fontFamily: "Libre Baskerville",
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "0.02em",
            marginTop: 24,
            lineHeight: 1,
          }}
        >
          Trellis
        </div>

        {/* Tan accent line */}
        <div
          style={{
            width: 60,
            height: 2,
            background: "#b09352",
            marginTop: 24,
            opacity: 0.6,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontFamily: "Inter",
            fontSize: 22,
            fontWeight: 500,
            color: "#c1d4bf",
            marginTop: 20,
          }}
        >
          Every connection grows.
        </div>

        {/* Domain */}
        <div
          style={{
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.35)",
            position: "absolute",
            bottom: 32,
          }}
        >
          growyourtrellis.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Libre Baskerville",
          data: libreBold,
          weight: 700 as const,
          style: "normal" as const,
        },
        {
          name: "Inter",
          data: interMedium,
          weight: 500 as const,
          style: "normal" as const,
        },
      ],
    }
  );
}
