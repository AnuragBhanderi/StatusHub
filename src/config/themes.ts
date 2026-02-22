export interface Theme {
  name: string;
  icon: string;
  bg: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  headerBg: string;
  border: string;
  borderSubtle: string;
  borderHover: string;
  text: string;
  textHeading: string;
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
  accentSecondary: string;
  accentGreen: string;
  bannerOkBg: string;
  bannerOkBorder: string;
  bannerIssueBg: string;
  bannerIssueBorder: string;
  bannerCircle: number;
  cardShadow: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
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
  heroGradient: string;
  ctaBg: string;
  ctaText: string;
  ctaHover: string;
}

export const THEMES: Record<string, Theme> = {
  dark: {
    name: "Dark",
    icon: "dark",
    bg: "#09090b",
    surface: "#111113",
    surfaceElevated: "#18181b",
    surfaceHover: "#1c1c20",
    headerBg: "rgba(9,9,11,0.92)",
    border: "rgba(255,255,255,0.06)",
    borderSubtle: "rgba(255,255,255,0.04)",
    borderHover: "rgba(255,255,255,0.12)",
    text: "#fafafa",
    textHeading: "#ffffff",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    textFaint: "#52525b",
    searchBg: "#111113",
    searchText: "#e4e4e7",
    searchPlaceholder: "#52525b",
    pillBg: "rgba(255,255,255,0.03)",
    pillActiveBg: "rgba(99,102,241,0.12)",
    pillBorder: "rgba(255,255,255,0.06)",
    pillActiveBorder: "rgba(99,102,241,0.4)",
    pillText: "#71717a",
    pillActiveText: "#818cf8",
    logoBg: "#1c1c20",
    logoBorder: "rgba(255,255,255,0.06)",
    accentPrimary: "#6366f1",
    accentSecondary: "#818cf8",
    accentGreen: "#3ddc84",
    bannerOkBg:
      "linear-gradient(135deg, rgba(61,220,132,0.05) 0%, rgba(99,102,241,0.02) 100%)",
    bannerOkBorder: "rgba(61,220,132,0.10)",
    bannerIssueBg:
      "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(99,102,241,0.02) 100%)",
    bannerIssueBorder: "rgba(239,68,68,0.12)",
    bannerCircle: 0.03,
    cardShadow: "0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)",
    shadowSm: "0 1px 2px rgba(0,0,0,0.3)",
    shadowMd: "0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
    shadowLg: "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)",
    stackBtnBg: "rgba(99,102,241,0.15)",
    stackBtnBorder: "rgba(99,102,241,0.3)",
    stackBtnInactive: "#52525b",
    footerColor: "#3f3f46",
    scrollThumb: "#27272a",
    divider: "rgba(255,255,255,0.04)",
    tagBg: "rgba(255,255,255,0.04)",
    tagText: "#71717a",
    emptyIcon: 0.4,
    emptyText: "#71717a",
    emptySubtext: "#52525b",
    betaBg: "rgba(99,102,241,0.10)",
    betaText: "#818cf8",
    heroGradient: "linear-gradient(135deg, #6366f1 0%, #3ddc84 100%)",
    ctaBg: "#6366f1",
    ctaText: "#ffffff",
    ctaHover: "#5558e6",
  },
  light: {
    name: "Light",
    icon: "light",
    bg: "#fafafa",
    surface: "#ffffff",
    surfaceElevated: "#ffffff",
    surfaceHover: "#f4f4f5",
    headerBg: "rgba(250,250,250,0.95)",
    border: "rgba(0,0,0,0.08)",
    borderSubtle: "rgba(0,0,0,0.05)",
    borderHover: "rgba(0,0,0,0.15)",
    text: "#18181b",
    textHeading: "#09090b",
    textSecondary: "#52525b",
    textMuted: "#71717a",
    textFaint: "#a1a1aa",
    searchBg: "#ffffff",
    searchText: "#18181b",
    searchPlaceholder: "#a1a1aa",
    pillBg: "#ffffff",
    pillActiveBg: "rgba(99,102,241,0.08)",
    pillBorder: "rgba(0,0,0,0.08)",
    pillActiveBorder: "rgba(99,102,241,0.35)",
    pillText: "#71717a",
    pillActiveText: "#6366f1",
    logoBg: "#f4f4f5",
    logoBorder: "rgba(0,0,0,0.08)",
    accentPrimary: "#6366f1",
    accentSecondary: "#818cf8",
    accentGreen: "#16a34a",
    bannerOkBg:
      "linear-gradient(135deg, rgba(22,163,74,0.05) 0%, rgba(99,102,241,0.03) 100%)",
    bannerOkBorder: "rgba(22,163,74,0.15)",
    bannerIssueBg:
      "linear-gradient(135deg, rgba(220,38,38,0.05) 0%, rgba(249,115,22,0.03) 100%)",
    bannerIssueBorder: "rgba(220,38,38,0.15)",
    bannerCircle: 0.04,
    cardShadow: "0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)",
    shadowSm: "0 1px 2px rgba(0,0,0,0.04)",
    shadowMd: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    shadowLg: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
    stackBtnBg: "rgba(99,102,241,0.08)",
    stackBtnBorder: "rgba(99,102,241,0.25)",
    stackBtnInactive: "#a1a1aa",
    footerColor: "#a1a1aa",
    scrollThumb: "#d4d4d8",
    divider: "rgba(0,0,0,0.05)",
    tagBg: "rgba(0,0,0,0.03)",
    tagText: "#71717a",
    emptyIcon: 0.35,
    emptyText: "#71717a",
    emptySubtext: "#a1a1aa",
    betaBg: "rgba(99,102,241,0.08)",
    betaText: "#6366f1",
    heroGradient: "linear-gradient(135deg, #6366f1 0%, #16a34a 100%)",
    ctaBg: "#6366f1",
    ctaText: "#ffffff",
    ctaHover: "#5558e6",
  },
  midnight: {
    name: "Midnight",
    icon: "midnight",
    bg: "#04040a",
    surface: "#0a0a14",
    surfaceElevated: "#10101c",
    surfaceHover: "#14141f",
    headerBg: "rgba(4,4,10,0.94)",
    border: "rgba(100,120,255,0.08)",
    borderSubtle: "rgba(100,120,255,0.05)",
    borderHover: "rgba(100,120,255,0.15)",
    text: "#e0e4f0",
    textHeading: "#eef0ff",
    textSecondary: "#9098b8",
    textMuted: "#606890",
    textFaint: "#454c6e",
    searchBg: "#0a0a14",
    searchText: "#d0d4e8",
    searchPlaceholder: "#454c6e",
    pillBg: "rgba(100,120,255,0.04)",
    pillActiveBg: "rgba(120,140,255,0.10)",
    pillBorder: "rgba(100,120,255,0.08)",
    pillActiveBorder: "rgba(120,140,255,0.30)",
    pillText: "#606890",
    pillActiveText: "#a5b4fc",
    logoBg: "#0e0e1a",
    logoBorder: "rgba(100,120,255,0.08)",
    accentPrimary: "#a5b4fc",
    accentSecondary: "#818cf8",
    accentGreen: "#44ddaa",
    bannerOkBg:
      "linear-gradient(135deg, rgba(68,221,170,0.05) 0%, rgba(136,153,255,0.03) 100%)",
    bannerOkBorder: "rgba(68,221,170,0.10)",
    bannerIssueBg:
      "linear-gradient(135deg, rgba(255,82,82,0.06) 0%, rgba(200,100,255,0.03) 100%)",
    bannerIssueBorder: "rgba(255,82,82,0.10)",
    bannerCircle: 0.02,
    cardShadow: "0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
    shadowSm: "0 1px 2px rgba(0,0,0,0.4)",
    shadowMd: "0 2px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
    shadowLg: "0 4px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)",
    stackBtnBg: "rgba(165,180,252,0.12)",
    stackBtnBorder: "rgba(165,180,252,0.25)",
    stackBtnInactive: "#454c6e",
    footerColor: "#353858",
    scrollThumb: "#1a1a2e",
    divider: "rgba(100,120,255,0.05)",
    tagBg: "rgba(100,120,255,0.05)",
    tagText: "#606890",
    emptyIcon: 0.35,
    emptyText: "#606890",
    emptySubtext: "#454c6e",
    betaBg: "rgba(165,180,252,0.10)",
    betaText: "#a5b4fc",
    heroGradient: "linear-gradient(135deg, #a5b4fc 0%, #44ddaa 100%)",
    ctaBg: "#a5b4fc",
    ctaText: "#04040a",
    ctaHover: "#8b9cf8",
  },
};

export type ThemeKey = keyof typeof THEMES;
