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
  FooterText:string;
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
    FooterText:'#40403f'
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
    FooterText:'#40403f'
  },
};

export const superAdminThemeTokens: { light: AdminThemeTokens; dark: AdminThemeTokens } = {
  light: {
    primaryBg: '#FFFFFF',
    secondaryBg: '#FFFFFF',
    brand: '#835CEE',
    brandHover: '#6d45d4',
    accent: '#835CEE',
    textPrimary: '#0a0a0a',
    textSecondary: '#52525b',
    textMuted: '#a1a1aa',
    sidebarBg: '#161616',
    sidebarText: '#FFFFFF',
    sidebarHover: '#27272a',
    cardBg: '#FFFFFF',
    border: '#e4e4e7',
    inputBg: '#f4f4f5',
    activePillBg: '#835CEE',
    activePillText: '#FFFFFF',
    badgeBg: '#835CEE18',
    badgeText: '#835CEE',
    FooterText: '#71717a',
  },
  dark: {
    primaryBg: '#161616',
    secondaryBg: '#1c1c1c',
    brand: '#835CEE',
    brandHover: '#9b7ef0',
    accent: '#a78bfa',
    textPrimary: '#FFFFFF',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    sidebarBg: '#0d0d0d',
    sidebarText: '#FFFFFF',
    sidebarHover: '#242424',
    cardBg: '#242424',
    border: '#2e2e2e',
    inputBg: '#1e1e1e',
    activePillBg: '#835CEE',
    activePillText: '#FFFFFF',
    badgeBg: '#835CEE25',
    badgeText: '#a78bfa',
    FooterText: '#71717a',
  },
};

export function getAdminTheme(isDark: boolean): AdminThemeTokens {
  return isDark ? adminThemeTokens.dark : adminThemeTokens.light;
}

export function getSuperAdminTheme(isDark: boolean): AdminThemeTokens {
  return isDark ? superAdminThemeTokens.dark : superAdminThemeTokens.light;
}
