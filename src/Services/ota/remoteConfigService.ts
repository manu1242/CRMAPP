import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { apiClient } from '../../api/apiClient';

export interface RemoteConfigData {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  minimumSupportedVersion: string;
  latestVersion: string;
  playStoreUrl: string;
  appStoreUrl: string;
  enableNewDashboard: boolean;
  enableExperimentalFeatures: boolean;
  primaryColor: string;
  featureFlags: Record<string, boolean>;
  noticeBanner?: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'alert';
    dismissible: boolean;
  } | null;
}

const STORAGE_KEY = '@app_remote_config_cache';

const DEFAULT_CONFIG: RemoteConfigData = {
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back shortly.',
  minimumSupportedVersion: '1.0.0',
  latestVersion: '1.5.1',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ultrakey.crm',
  appStoreUrl: 'https://apps.apple.com/app/idYOUR_APP_ID',
  enableNewDashboard: true,
  enableExperimentalFeatures: false,
  primaryColor: '#10b981',
  featureFlags: {
    enableRazorpayOta: true,
    enablePartnerSubHub: true,
    enableDetailedInvoices: true,
    enableChatbotV2: true,
  },
  noticeBanner: null,
};

// ── Version Comparison Helper (SemVer compliant) ──────────────────────────────

export function compareSemVer(v1: string, v2: string): number {
  const clean1 = (v1 || '0.0.0').replace(/[^0-9.]/g, '').split('.').map((n) => parseInt(n, 10) || 0);
  const clean2 = (v2 || '0.0.0').replace(/[^0-9.]/g, '').split('.').map((n) => parseInt(n, 10) || 0);

  const len = Math.max(clean1.length, clean2.length);
  for (let i = 0; i < len; i++) {
    const num1 = clean1[i] || 0;
    const num2 = clean2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function isVersionBelow(currentVersion: string, minimumVersion: string): boolean {
  return compareSemVer(currentVersion, minimumVersion) < 0;
}

type RemoteConfigListener = (config: RemoteConfigData) => void;

class RemoteConfigService {
  private config: RemoteConfigData = { ...DEFAULT_CONFIG };
  private listeners: Set<RemoteConfigListener> = new Set();
  private isInitialized = false;

  public getConfig(): RemoteConfigData {
    return { ...this.config };
  }

  public getInstalledAppVersion(): string {
    return (
      Constants.expoConfig?.version ||
      Constants.manifest2?.extra?.expoClient?.version ||
      '1.5.1'
    );
  }

  public isForceUpdateRequired(): boolean {
    const installed = this.getInstalledAppVersion();
    const minimum = this.config.minimumSupportedVersion;
    return isVersionBelow(installed, minimum);
  }

  public isFeatureEnabled(flagName: string): boolean {
    return Boolean(this.config.featureFlags[flagName]);
  }

  public subscribe(listener: RemoteConfigListener): () => void {
    this.listeners.add(listener);
    listener(this.getConfig());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.getConfig());
      } catch (err) {
        console.warn('[RemoteConfig] Listener error:', err);
      }
    });
  }

  /**
   * Initialize on app startup:
   * 1. Hydrate from AsyncStorage cache immediately.
   * 2. Non-blocking fetch from backend endpoint.
   */
  public async init(): Promise<RemoteConfigData> {
    if (this.isInitialized) return this.getConfig();

    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.config = { ...DEFAULT_CONFIG, ...parsed };
        this.notify();
      }
    } catch {
      // Use defaults
    }

    this.isInitialized = true;
    this.fetchRemoteConfig().catch(() => {});
    return this.getConfig();
  }

  /**
   * Fetch updated config from the backend.
   * Safe JSON validation: never evaluates code or executes arbitrary scripts.
   */
  public async fetchRemoteConfig(): Promise<RemoteConfigData> {
    try {
      // Attempt to load from system settings or dedicated mobile config endpoint
      const response = await apiClient.get<any>('/api/v1/systemsettings', {
        timeout: 8000,
      });

      if (response && response.data) {
        const data = response.data.settings || response.data;
        const newConfig: Partial<RemoteConfigData> = {};

        if (typeof data.maintenanceMode === 'boolean') {
          newConfig.maintenanceMode = data.maintenanceMode;
        } else if (data.MaintenanceMode === 'true' || data.MaintenanceMode === true) {
          newConfig.maintenanceMode = true;
        }

        if (data.minimumSupportedVersion || data.MinimumSupportedVersion) {
          newConfig.minimumSupportedVersion = String(data.minimumSupportedVersion || data.MinimumSupportedVersion).trim();
        }

        if (data.latestVersion || data.LatestVersion) {
          newConfig.latestVersion = String(data.latestVersion || data.LatestVersion).trim();
        }

        if (data.primaryColor || data.PrimaryColor) {
          newConfig.primaryColor = String(data.primaryColor || data.PrimaryColor).trim();
        }

        if (data.featureFlags && typeof data.featureFlags === 'object') {
          newConfig.featureFlags = { ...this.config.featureFlags, ...data.featureFlags };
        }

        this.config = {
          ...this.config,
          ...newConfig,
        };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
        this.notify();
      }
    } catch {
      // Retain existing cached/default config on network failure
    }

    return this.getConfig();
  }
}

export const remoteConfigService = new RemoteConfigService();
