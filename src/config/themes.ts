export interface Theme {
  name: string;
  icon: string;
  bg: string;
  surface: string;
  surfaceHover: string;
  headerBg: string;
  border: string;
  borderHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  searchBg: string;
  searchText: string;
  searchPlaceholder: string;
  pillBg: string;
  pillActiveBg: string;
  pillBorder: string;
  pillActiveBorder: string;
  pillText: string;
  pillActiveText: string;
  logoBg: string;
  logoBorder: string;
  accentPrimary: string;
  accentGreen: string;
  bannerOkBg: string;
  bannerOkBorder: string;
  bannerIssueBg: string;
  bannerIssueBorder: string;
  bannerCircle: number;
  cardShadow: string;
  stackBtnBg: string;
  stackBtnBorder: string;
  stackBtnInactive: string;
  footerColor: string;
  scrollThumb: string;
  divider: string;
  tagBg: string;
  tagText: string;
  emptyIcon: number;
  emptyText: string;
  emptySubtext: string;
  betaBg: string;
  betaText: string;
}

export const THEMES: Record<string, Theme> = {
  dark: {
    name: "Dark",
    icon: "dark",
    bg: "#0c0c10",
    surface: "#16161c",
    surfaceHover: "#1e1e26",
    headerBg: "rgba(12,12,16,0.92)",
    border: "rgba(255,255,255,0.08)",
    borderHover: "rgba(255,255,255,0.14)",
    text: "#f0f0f0",
    textSecondary: "#aaa",
    textMuted: "#777",
    textFaint: "#555",
    searchBg: "#16161c",
    searchText: "#e0e0e0",
    searchPlaceholder: "#555",
    pillBg: "rgba(255,255,255,0.03)",
    pillActiveBg: "rgba(99,140,255,0.12)",
    pillBorder: "rgba(255,255,255,0.08)",
    pillActiveBorder: "rgba(99,140,255,0.4)",
    pillText: "#777",
    pillActiveText: "#638CFF",
    logoBg: "#222228",
    logoBorder: "rgba(255,255,255,0.08)",
    accentPrimary: "#638CFF",
    accentGreen: "#3ddc84",
    bannerOkBg:
      "linear-gradient(135deg, rgba(61,220,132,0.06) 0%, rgba(99,140,255,0.03) 100%)",
    bannerOkBorder: "rgba(61,220,132,0.12)",
    bannerIssueBg:
      "linear-gradient(135deg, rgba(255,82,82,0.08) 0%, rgba(99,140,255,0.03) 100%)",
    bannerIssueBorder: "rgba(255,82,82,0.14)",
    bannerCircle: 0.04,
    cardShadow: "0 4px 24px rgba(0,0,0,0.4)",
    stackBtnBg: "rgba(99,140,255,0.15)",
    stackBtnBorder: "rgba(99,140,255,0.3)",
    stackBtnInactive: "#555",
    footerColor: "#444",
    scrollThumb: "#333",
    divider: "rgba(255,255,255,0.05)",
    tagBg: "rgba(255,255,255,0.05)",
    tagText: "#888",
    emptyIcon: 0.4,
    emptyText: "#777",
    emptySubtext: "#555",
    betaBg: "rgba(99,140,255,0.1)",
    betaText: "#638CFF",
  },
  light: {
    name: "Light",
    icon: "light",
    bg: "#f0f2f5",
    surface: "#ffffff",
    surfaceHover: "#f5f6f8",
    headerBg: "rgba(255,255,255,0.95)",
    border: "rgba(0,0,0,0.10)",
    borderHover: "rgba(0,0,0,0.18)",
    text: "#1a1a1a",
    textSecondary: "#4a4a4a",
    textMuted: "#777",
    textFaint: "#aaa",
    searchBg: "#ffffff",
    searchText: "#1a1a1a",
    searchPlaceholder: "#999",
    pillBg: "#ffffff",
    pillActiveBg: "rgba(59,130,246,0.10)",
    pillBorder: "rgba(0,0,0,0.10)",
    pillActiveBorder: "rgba(59,130,246,0.4)",
    pillText: "#777",
    pillActiveText: "#2563eb",
    logoBg: "#e4e6eb",
    logoBorder: "rgba(0,0,0,0.12)",
    accentPrimary: "#2563eb",
    accentGreen: "#16a34a",
    bannerOkBg:
      "linear-gradient(135deg, rgba(22,163,74,0.07) 0%, rgba(37,99,235,0.04) 100%)",
    bannerOkBorder: "rgba(22,163,74,0.18)",
    bannerIssueBg:
      "linear-gradient(135deg, rgba(220,38,38,0.07) 0%, rgba(249,115,22,0.04) 100%)",
    bannerIssueBorder: "rgba(220,38,38,0.18)",
    bannerCircle: 0.05,
    cardShadow: "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
    stackBtnBg: "rgba(37,99,235,0.08)",
    stackBtnBorder: "rgba(37,99,235,0.25)",
    stackBtnInactive: "#bbb",
    footerColor: "#aaa",
    scrollThumb: "#d0d0d0",
    divider: "rgba(0,0,0,0.06)",
    tagBg: "rgba(0,0,0,0.04)",
    tagText: "#777",
    emptyIcon: 0.35,
    emptyText: "#777",
    emptySubtext: "#aaa",
    betaBg: "rgba(37,99,235,0.08)",
    betaText: "#2563eb",
  },
  midnight: {
    name: "Midnight",
    icon: "midnight",
    bg: "#06060c",
    surface: "#0e0e18",
    surfaceHover: "#151520",
    headerBg: "rgba(6,6,12,0.94)",
    border: "rgba(100,120,255,0.10)",
    borderHover: "rgba(100,120,255,0.18)",
    text: "#e0e4f0",
    textSecondary: "#9098b8",
    textMuted: "#606890",
    textFaint: "#454c6e",
    searchBg: "#0e0e18",
    searchText: "#d0d4e8",
    searchPlaceholder: "#454c6e",
    pillBg: "rgba(100,120,255,0.04)",
    pillActiveBg: "rgba(120,140,255,0.12)",
    pillBorder: "rgba(100,120,255,0.10)",
    pillActiveBorder: "rgba(120,140,255,0.35)",
    pillText: "#606890",
    pillActiveText: "#99aaff",
    logoBg: "#14141e",
    logoBorder: "rgba(100,120,255,0.10)",
    accentPrimary: "#99aaff",
    accentGreen: "#44ddaa",
    bannerOkBg:
      "linear-gradient(135deg, rgba(68,221,170,0.06) 0%, rgba(136,153,255,0.04) 100%)",
    bannerOkBorder: "rgba(68,221,170,0.12)",
    bannerIssueBg:
      "linear-gradient(135deg, rgba(255,82,82,0.07) 0%, rgba(200,100,255,0.04) 100%)",
    bannerIssueBorder: "rgba(255,82,82,0.12)",
    bannerCircle: 0.03,
    cardShadow: "0 4px 24px rgba(0,0,0,0.5)",
    stackBtnBg: "rgba(136,153,255,0.12)",
    stackBtnBorder: "rgba(136,153,255,0.25)",
    stackBtnInactive: "#454c6e",
    footerColor: "#353858",
    scrollThumb: "#1e1e32",
    divider: "rgba(100,120,255,0.06)",
    tagBg: "rgba(100,120,255,0.07)",
    tagText: "#606890",
    emptyIcon: 0.35,
    emptyText: "#606890",
    emptySubtext: "#454c6e",
    betaBg: "rgba(136,153,255,0.10)",
    betaText: "#99aaff",
  },
};

export type ThemeKey = keyof typeof THEMES;
