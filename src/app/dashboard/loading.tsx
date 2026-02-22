export default function DashboardLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c10",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header skeleton */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 0",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
              }}
            />
            <div
              style={{
                width: 90,
                height: 16,
                borderRadius: 4,
                background: "rgba(255,255,255,0.06)",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
              }}
            />
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {/* Banner skeleton */}
        <div
          className="sh-skeleton-pulse"
          style={{
            height: 72,
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            marginBottom: 24,
          }}
        />

        {/* Search skeleton */}
        <div
          className="sh-skeleton-pulse"
          style={{
            height: 44,
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            marginBottom: 16,
          }}
        />

        {/* Toolbar skeleton */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div
            className="sh-skeleton-pulse"
            style={{
              width: 200,
              height: 34,
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
            }}
          />
          <div
            className="sh-skeleton-pulse"
            style={{
              width: 100,
              height: 34,
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
            }}
          />
        </div>

        {/* Category pills skeleton */}
        <div
          style={{ display: "flex", gap: 6, marginBottom: 20 }}
        >
          {[60, 70, 50, 80, 55, 65].map((w, i) => (
            <div
              key={i}
              className="sh-skeleton-pulse"
              style={{
                width: w,
                height: 30,
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>

        {/* Grid skeleton */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 10,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="sh-skeleton-pulse"
              style={{
                height: 100,
                borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sh-skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .sh-skeleton-pulse {
          animation: sh-skeleton-pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
