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
    surface: "#15151a",
    surfaceHover: "#1c1c22",
    headerBg: "rgba(12,12,16,0.88)",
    border: "rgba(255,255,255,0.05)",
    borderHover: "rgba(255,255,255,0.1)",
    text: "#f0f0f0",
    textSecondary: "#aaa",
    textMuted: "#666",
    textFaint: "#444",
    searchBg: "#15151a",
    searchText: "#e0e0e0",
    searchPlaceholder: "#444",
    pillBg: "transparent",
    pillActiveBg: "rgba(99,140,255,0.1)",
    pillBorder: "rgba(255,255,255,0.05)",
    pillActiveBorder: "rgba(99,140,255,0.35)",
    pillText: "#666",
    pillActiveText: "#638CFF",
    logoBg: "#222228",
    logoBorder: "rgba(255,255,255,0.06)",
    accentPrimary: "#638CFF",
    accentGreen: "#3ddc84",
    bannerOkBg:
      "linear-gradient(135deg, rgba(61,220,132,0.05) 0%, rgba(99,140,255,0.03) 100%)",
    bannerOkBorder: "rgba(61,220,132,0.08)",
    bannerIssueBg:
      "linear-gradient(135deg, rgba(255,82,82,0.06) 0%, rgba(99,140,255,0.03) 100%)",
    bannerIssueBorder: "rgba(255,82,82,0.1)",
    bannerCircle: 0.03,
    cardShadow: "0 8px 32px rgba(0,0,0,0.4)",
    stackBtnBg: "rgba(99,140,255,0.15)",
    stackBtnBorder: "rgba(99,140,255,0.3)",
    stackBtnInactive: "#444",
    footerColor: "#333",
    scrollThumb: "#333",
    divider: "rgba(255,255,255,0.03)",
    tagBg: "rgba(255,255,255,0.04)",
    tagText: "#777",
    emptyIcon: 0.4,
    emptyText: "#666",
    emptySubtext: "#444",
    betaBg: "rgba(99,140,255,0.1)",
    betaText: "#638CFF",
  },
  light: {
    name: "Light",
    icon: "light",
    bg: "#f5f6f8",
    surface: "#ffffff",
    surfaceHover: "#f8f9fb",
    headerBg: "rgba(255,255,255,0.92)",
    border: "rgba(0,0,0,0.08)",
    borderHover: "rgba(0,0,0,0.14)",
    text: "#1a1a1a",
    textSecondary: "#555",
    textMuted: "#888",
    textFaint: "#bbb",
    searchBg: "#ffffff",
    searchText: "#1a1a1a",
    searchPlaceholder: "#aaa",
    pillBg: "#ffffff",
    pillActiveBg: "rgba(59,130,246,0.08)",
    pillBorder: "rgba(0,0,0,0.08)",
    pillActiveBorder: "rgba(59,130,246,0.35)",
    pillText: "#888",
    pillActiveText: "#3b82f6",
    logoBg: "#f0f1f3",
    logoBorder: "rgba(0,0,0,0.06)",
    accentPrimary: "#3b82f6",
    accentGreen: "#22c55e",
    bannerOkBg:
      "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(59,130,246,0.04) 100%)",
    bannerOkBorder: "rgba(34,197,94,0.15)",
    bannerIssueBg:
      "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(249,115,22,0.04) 100%)",
    bannerIssueBorder: "rgba(239,68,68,0.15)",
    bannerCircle: 0.04,
    cardShadow: "0 4px 16px rgba(0,0,0,0.06)",
    stackBtnBg: "rgba(59,130,246,0.08)",
    stackBtnBorder: "rgba(59,130,246,0.25)",
    stackBtnInactive: "#ccc",
    footerColor: "#bbb",
    scrollThumb: "#ddd",
    divider: "rgba(0,0,0,0.05)",
    tagBg: "rgba(0,0,0,0.04)",
    tagText: "#888",
    emptyIcon: 0.3,
    emptyText: "#888",
    emptySubtext: "#bbb",
    betaBg: "rgba(59,130,246,0.08)",
    betaText: "#3b82f6",
  },
  midnight: {
    name: "Midnight",
    icon: "midnight",
    bg: "#05050a",
    surface: "#0d0d14",
    surfaceHover: "#13131c",
    headerBg: "rgba(5,5,10,0.92)",
    border: "rgba(100,120,255,0.06)",
    borderHover: "rgba(100,120,255,0.12)",
    text: "#e0e4f0",
    textSecondary: "#8890b0",
    textMuted: "#555c80",
    textFaint: "#333855",
    searchBg: "#0d0d14",
    searchText: "#d0d4e8",
    searchPlaceholder: "#333855",
    pillBg: "transparent",
    pillActiveBg: "rgba(120,140,255,0.08)",
    pillBorder: "rgba(100,120,255,0.06)",
    pillActiveBorder: "rgba(120,140,255,0.3)",
    pillText: "#555c80",
    pillActiveText: "#8899ff",
    logoBg: "#12121c",
    logoBorder: "rgba(100,120,255,0.08)",
    accentPrimary: "#8899ff",
    accentGreen: "#44ddaa",
    bannerOkBg:
      "linear-gradient(135deg, rgba(68,221,170,0.04) 0%, rgba(136,153,255,0.03) 100%)",
    bannerOkBorder: "rgba(68,221,170,0.08)",
    bannerIssueBg:
      "linear-gradient(135deg, rgba(255,82,82,0.05) 0%, rgba(200,100,255,0.03) 100%)",
    bannerIssueBorder: "rgba(255,82,82,0.08)",
    bannerCircle: 0.02,
    cardShadow: "0 8px 32px rgba(0,0,0,0.6)",
    stackBtnBg: "rgba(136,153,255,0.1)",
    stackBtnBorder: "rgba(136,153,255,0.2)",
    stackBtnInactive: "#333855",
    footerColor: "#252840",
    scrollThumb: "#1a1a2e",
    divider: "rgba(100,120,255,0.04)",
    tagBg: "rgba(100,120,255,0.06)",
    tagText: "#667",
    emptyIcon: 0.3,
    emptyText: "#555c80",
    emptySubtext: "#333855",
    betaBg: "rgba(136,153,255,0.08)",
    betaText: "#8899ff",
  },
};

export type ThemeKey = keyof typeof THEMES;
