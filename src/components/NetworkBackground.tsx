"use client";

import type { Theme } from "@/config/themes";

/* ─────────────────────────────────────────────────────────
 *  Network topology background — visualises "monitoring in
 *  progress" with nodes, connections, traveling pulses and
 *  ping ripples.  Pure SVG declarative animations (no JS
 *  animation loop) so it's lightweight.
 *
 *  viewBox 1440×900 is sliced to fill the viewport.
 * ───────────────────────────────────────────────────────── */

// Node positions — organic, constellation-like scatter
const N: [number, number][] = [
  // top
  [120, 90],  [380, 150], [650, 70],  [900, 180], [1150, 100], [1350, 160],
  // middle-upper
  [80, 340],  [320, 400], [580, 310], [830, 420], [1080, 350], [1320, 410],
  // middle-lower
  [200, 580], [460, 640], [720, 560], [970, 630], [1220, 570], [1400, 650],
  // bottom
  [140, 780], [540, 820], [940, 770], [1300, 810],
];

// Connections between nodes (index pairs)
const C: [number, number][] = [
  // top row
  [0,1],[1,2],[2,3],[3,4],[4,5],
  // top → mid-upper
  [0,6],[1,7],[2,8],[3,9],[4,10],[5,11],
  // mid-upper row
  [6,7],[7,8],[8,9],[9,10],[10,11],
  // mid-upper → mid-lower
  [6,12],[7,13],[8,14],[9,15],[10,16],[11,17],
  // mid-lower row
  [12,13],[13,14],[14,15],[15,16],[16,17],
  // mid-lower → bottom
  [12,18],[14,19],[15,20],[17,21],
  // bottom row
  [18,19],[19,20],[20,21],
  // extra cross-links for depth
  [1,8],[3,10],[8,15],[10,17],
];

// Pulse routes — chains of node indices the dot travels through
const PULSES = [
  { n: [0, 1, 2, 3, 4],         dur: 8,  delay: 0   },
  { n: [5, 4, 10, 16, 17],      dur: 9,  delay: 2   },
  { n: [18, 12, 6, 0, 1],       dur: 9,  delay: 4.5 },
  { n: [21, 20, 15, 9, 3, 2],   dur: 11, delay: 1   },
  { n: [6, 7, 8, 14, 19],       dur: 8,  delay: 3   },
  { n: [11, 10, 9, 8, 7, 13],   dur: 10, delay: 6   },
  { n: [17, 11, 5, 4, 3],       dur: 9,  delay: 7.5 },
  { n: [12, 13, 14, 15, 16],    dur: 8,  delay: 5   },
];

// Nodes that emit expanding "ping" ripples (being checked)
const PINGS = [2, 5, 9, 14, 20];

export default function NetworkBackground({ t }: { t: Theme }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%" }}
        aria-hidden="true"
      >
        <defs>
          <filter id="sh-glow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* ── Connection lines ── */}
        {C.map(([a, b], i) => (
          <line
            key={`l${i}`}
            x1={N[a][0]} y1={N[a][1]}
            x2={N[b][0]} y2={N[b][1]}
            stroke={t.accentPrimary}
            strokeWidth="0.5"
            opacity="0.055"
          />
        ))}

        {/* ── Node dots ── */}
        {N.map(([x, y], i) => (
          <circle
            key={`n${i}`}
            cx={x} cy={y} r="2"
            fill={t.accentPrimary}
            opacity="0.12"
          />
        ))}

        {/* ── Ping ripples (expanding rings at select nodes) ── */}
        <g className="sh-network-animated">
          {PINGS.map((ni, i) => (
            <circle
              key={`p${i}`}
              cx={N[ni][0]} cy={N[ni][1]}
              fill="none"
              stroke={t.accentPrimary}
              strokeWidth="0.5"
            >
              <animate
                attributeName="r"
                values="3;28"
                dur={`${3.5 + i * 0.6}s`}
                begin={`${i * 1.8}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.18;0"
                dur={`${3.5 + i * 0.6}s`}
                begin={`${i * 1.8}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>

        {/* ── Traveling pulse dots ── */}
        <g className="sh-network-animated">
          {PULSES.map((route, pi) => {
            const d = route.n
              .map((ni, j) => `${j === 0 ? "M" : "L"}${N[ni][0]},${N[ni][1]}`)
              .join(" ");
            const id = `sh-p${pi}`;
            return (
              <g key={id}>
                <path id={id} d={d} fill="none" />

                {/* Outer glow */}
                <circle r="6" fill={t.accentPrimary} filter="url(#sh-glow)">
                  <animateMotion
                    dur={`${route.dur}s`}
                    begin={`${route.delay}s`}
                    repeatCount="indefinite"
                  >
                    <mpath href={`#${id}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values="0;0.12;0.12;0"
                    keyTimes="0;0.08;0.88;1"
                    dur={`${route.dur}s`}
                    begin={`${route.delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Core dot */}
                <circle r="1.5" fill={t.accentPrimary}>
                  <animateMotion
                    dur={`${route.dur}s`}
                    begin={`${route.delay}s`}
                    repeatCount="indefinite"
                  >
                    <mpath href={`#${id}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values="0;0.4;0.4;0"
                    keyTimes="0;0.08;0.88;1"
                    dur={`${route.dur}s`}
                    begin={`${route.delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
