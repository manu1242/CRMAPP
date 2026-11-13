/**
 * Dynamic API URL & Multi-Tenant Routing Engine
 *
 * Architecture:
 * 1. Platform Base URL:
 *    - Defaults to EXPO_PUBLIC_API_URL or "https://uproptech.com"
 *    - Handles all pre-auth requests (login, registration, password reset, workspace selection)
 *    - Handles all SuperAdmin requests (central platform management)
 *
 * 2. Company Dynamic Subdomain Routing:
 *    - Once authenticated, company users (Admin, Agent, Channel Partner) have their
 *      authoritative tenant subdomain (e.g. "hiriseenterprises", "srinainikaproperties")
 *    - In domain mode (e.g. "https://uproptech.com"), requests route directly to:
 *      https://<subdomain>.uproptech.com
 *    - In IP / localhost mode (e.g. http://192.168.31.250:5139), base URL is kept as-is,
 *      and tenant context is attached via X-Tenant-Subdomain and X-Tenant-Id headers.
 *    - On logout / account switch, context resets back to the platform base URL.
 */

const PRODUCTION_API_URL = 'https://uproptech.com';

let platformBaseUrl: string = (process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL).replace(/\/+$/, '');
let activeTenantSubdomain: string | null = null;

export interface RemoteConfig {
  apiUrl: string;
}

/**
 * Returns the central platform API URL (e.g. "https://uproptech.com").
 * Used for pre-auth actions and SuperAdmin operations.
 */
export function getPlatformApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  return (envUrl && envUrl.trim() ? envUrl : (platformBaseUrl || PRODUCTION_API_URL)).replace(/\/+$/, '');
}

/**
 * Derives a tenant-specific API URL from the platform base URL and company subdomain.
 * Examples:
 * - "https://uproptech.com" + "hiriseenterprises" => "https://hiriseenterprises.uproptech.com"
 * - "https://uproptech.com" + "srinainikaproperties" => "https://srinainikaproperties.uproptech.com"
 * - "http://192.168.31.250:5139" + "hiriseenterprises" => "http://192.168.31.250:5139" (IP retained)
 */
export function resolveTenantApiUrl(platformUrl: string, subdomain?: string | null): string {
  const cleanBase = platformUrl.replace(/\/+$/, '');
  if (!subdomain || !subdomain.trim()) {
    return cleanBase;
  }

  const cleanSub = subdomain.trim().toLowerCase();

  try {
    // If URL doesn't have a protocol, prepend https:// for parsing
    const hasProtocol = /^https?:\/\//i.test(cleanBase);
    const parseUrl = hasProtocol ? cleanBase : `https://${cleanBase}`;
    const url = new URL(parseUrl);
    const hostname = url.hostname.toLowerCase();

    // Check if hostname is an IP address or localhost
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isIp || isLocalhost) {
      // In local IP or localhost development, keep base URL as-is; headers handle tenant resolution
      return cleanBase;
    }

    // Extract root domain: if hostname has subdomains, strip them
    // e.g. "hiriseenterprises.uproptech.com" -> ["hiriseenterprises", "uproptech", "com"] -> "uproptech.com"
    const hostParts = hostname.split('.');
    let rootDomain = hostname;
    if (hostParts.length > 2) {
      rootDomain = hostParts.slice(-2).join('.');
    }

    url.hostname = `${cleanSub}.${rootDomain}`;
    return url.origin;
  } catch {
    return cleanBase;
  }
}

/**
 * Sets the active company tenant subdomain.
 * Pass null or undefined for SuperAdmin or when unauthenticated.
 */
export function setTenantSubdomain(subdomain: string | null | undefined): void {
  activeTenantSubdomain = subdomain ? subdomain.trim().toLowerCase() : null;
  if (__DEV__) {
    console.log(`[TENANT ROUTING] Active tenant subdomain set to: ${activeTenantSubdomain || 'PLATFORM (ROOT)'}`);
    console.log(`[TENANT ROUTING] Active API URL is now: ${getApiUrl()}`);
  }
}

/**
 * Returns the currently active tenant subdomain, or null if platform/superadmin.
 */
export function getTenantSubdomain(): string | null {
  return activeTenantSubdomain;
}

/**
 * Clears the active tenant context and resets routing to the platform base URL.
 */
export function clearTenantContext(): void {
  activeTenantSubdomain = null;
  if (__DEV__) {
    console.log('[TENANT ROUTING] Tenant context cleared. Reverted to platform base URL:', getPlatformApiUrl());
  }
}

/**
 * Returns the active API URL for current operations.
 * If a tenant subdomain is active, returns the company-specific URL.
 * Otherwise, returns the platform base URL.
 */
export function getApiUrl(): string {
  const base = getPlatformApiUrl();
  if (activeTenantSubdomain) {
    return resolveTenantApiUrl(base, activeTenantSubdomain);
  }
  return base;
}

/**
 * Initializes remote config at app launch.
 */
export function initRemoteConfig(): Promise<void> {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  platformBaseUrl = (envUrl && envUrl.trim() ? envUrl : PRODUCTION_API_URL).replace(/\/+$/, '');
  return Promise.resolve();
}
