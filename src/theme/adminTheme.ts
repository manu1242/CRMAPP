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
    primaryBg: '#f8fafc',
    secondaryBg: '#ffffff',
    brand: '#2563eb',
    brandHover: '#1d4ed8',
    accent: '#0284c7',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    sidebarBg: '#0f172a',
    sidebarText: '#ffffff',
    sidebarHover: '#1e293b',
    cardBg: '#ffffff',
    border: '#e2e8f0',
    inputBg: '#f1f5f9',
    activePillBg: '#2563eb',
    activePillText: '#ffffff',
    badgeBg: '#2563eb15',
    badgeText: '#2563eb',
    FooterText: '#64748b',
  },
  dark: {
    primaryBg: '#0f172a',
    secondaryBg: '#1e293b',
    brand: '#3b82f6',
    brandHover: '#60a5fa',
    accent: '#38bdf8',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    sidebarBg: '#0b1120',
    sidebarText: '#ffffff',
    sidebarHover: '#1e293b',
    cardBg: '#1e293b',
    border: '#334155',
    inputBg: '#1e293b',
    activePillBg: '#2563eb',
    activePillText: '#ffffff',
    badgeBg: '#2563eb25',
    badgeText: '#60a5fa',
    FooterText: '#94a3b8',
  },
};

export function getAdminTheme(isDark: boolean): AdminThemeTokens {
  return isDark ? adminThemeTokens.dark : adminThemeTokens.light;
}

export function getSuperAdminTheme(isDark: boolean): AdminThemeTokens {
  return isDark ? superAdminThemeTokens.dark : superAdminThemeTokens.light;
}
