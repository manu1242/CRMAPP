/**
 * Admin Theme Tokens derived from src/theme/admin.css
 */
export interface AdminThemeTokens {
  primaryBg: string;
  secondaryBg: string;
  brand: string;
  brandHover: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarHover: string;
  cardBg: string;
  border: string;
  inputBg: string;
  activePillBg: string;
  activePillText: string;
  badgeBg: string;
  badgeText: string;
}

export const adminThemeTokens: { light: AdminThemeTokens; dark: AdminThemeTokens } = {
  light: {
    primaryBg: '#f8fafc',
    secondaryBg: '#ffffff',
    brand: '#10b981',
    brandHover: '#059669',
    accent: '#10b981',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    sidebarBg: '#1e293b',
    sidebarText: '#ffffff',
    sidebarHover: '#334155',
    cardBg: '#ffffff',
    border: '#e2e8f0',
    inputBg: '#f1f5f9',
    activePillBg: '#10b981',
    activePillText: '#ffffff',
    badgeBg: '#10b98115',
    badgeText: '#10b981',
  },
  dark: {
    primaryBg: '#000000',
    secondaryBg: '#000000',
    brand: '#10b981',
    brandHover: '#059669',
    accent: '#34d399',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    sidebarBg: '#18181b',
    sidebarText: '#ffffff',
    sidebarHover: '#27272a',
    cardBg: '#0C0C0C',
    border: '#27272a',
    inputBg: '#18181b',
    activePillBg: '#10b981',
    activePillText: '#ffffff',
    badgeBg: '#10b98120',
    badgeText: '#34d399',
  },
};

export function getAdminTheme(isDark: boolean): AdminThemeTokens {
  return isDark ? adminThemeTokens.dark : adminThemeTokens.light;
}
