import { ImageResponse } from "next/og";

export const alt = "2FA Authenticator — free two-factor authentication codes in your browser";
export const size = { width: 1200, height: 630 };
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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0e1a15",
          backgroundImage:
            "radial-gradient(circle at 25% 20%, rgba(52,211,153,0.16), transparent 45%), radial-gradient(circle at 80% 85%, rgba(45,212,191,0.12), transparent 40%)",
          color: "#f0fdf6",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 34,
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              background: "linear-gradient(135deg, #34d399, #0f766e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 20,
                top: 34,
                width: 36,
                height: 8,
                borderRadius: 4,
                background: "#ffffff",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 34,
                top: 20,
                width: 8,
                height: 36,
                borderRadius: 4,
                background: "#ffffff",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em" }}>
            2FA&nbsp;<span style={{ color: "#a7f3d0", fontWeight: 400 }}>Authenticator</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: "#ffffff",
            border: "2px solid rgba(52,211,153,0.45)",
            borderRadius: 24,
            padding: "22px 46px",
            background: "rgba(52,211,153,0.08)",
          }}
        >
          482 913
        </div>

        <div
          style={{
            marginTop: 34,
            display: "flex",
            fontSize: 30,
            color: "#bbf7d0",
          }}
        >
          Free two-factor codes — right in your browser
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            fontSize: 22,
            color: "rgba(236,253,245,0.55)",
          }}
        >
          TOTP · HOTP · Steam · QR sync · AES-256 encrypted
        </div>
      </div>
    ),
    size,
  );
}
