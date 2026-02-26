import Link from "next/link";

const popularServices = [
  { name: "GitHub", slug: "github" },
  { name: "AWS", slug: "aws" },
  { name: "Vercel", slug: "vercel" },
  { name: "Stripe", slug: "stripe" },
  { name: "OpenAI", slug: "openai" },
  { name: "Slack", slug: "slack" },
];

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "#fafafa",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "linear-gradient(135deg, #6366f1 0%, #3ddc84 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12h4l3-7 5 14 3-7h5"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1
        style={{
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: -2,
          margin: 0,
          background: "linear-gradient(135deg, #6366f1 0%, #3ddc84 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
        }}
      >
        404
      </h1>

      <p
        style={{
          fontSize: 18,
          color: "#a1a1aa",
          marginTop: 12,
          marginBottom: 8,
          maxWidth: 400,
        }}
      >
        This page doesn&apos;t exist.
      </p>
      <p
        style={{
          fontSize: 14,
          color: "#71717a",
          marginBottom: 32,
          maxWidth: 400,
        }}
      >
        The page you&apos;re looking for may have been moved or doesn&apos;t exist. Check out the dashboard or a service status page below.
      </p>

      <Link
        href="/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#6366f1",
          color: "#fff",
          padding: "12px 28px",
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 600,
          textDecoration: "none",
          marginBottom: 40,
          transition: "background 0.15s",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Go to Dashboard
      </Link>

      <div style={{ maxWidth: 480, width: "100%" }}>
        <p
          style={{
            fontSize: 12,
            color: "#52525b",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          Popular Services
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {popularServices.map((s) => (
            <Link
              key={s.slug}
              href={`/service/${s.slug}`}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                color: "#a1a1aa",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              {s.name} Status
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
