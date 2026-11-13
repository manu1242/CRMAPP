export interface PlatformFieldDefinition {
  key: string;
  label: string;
  required: boolean;
  secret?: boolean;
}

export interface PlatformConfigValues {
  apiKey?: string | null;
  apiSecret?: string | null;
  accountId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  projectId?: string | null;
  campaignId?: string | null;
  extraConfig?: string | null;
  pollIntervalMinutes?: number;
  isEnabled?: boolean;
}

export interface IntegrationItem {
  platform: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  isConfigured: boolean;
  isEnabled: boolean;
  leadsSynced: number;
  lastSyncedAt?: string | null;
  webhookUrl: string;
  pollIntervalMinutes: number;
  fields: PlatformFieldDefinition[];
  config?: PlatformConfigValues | null;
}

export interface IntegrationSummary {
  totalPlatforms: number;
  activePlatforms: number;
  totalLeadsSynced: number;
  hasTestData: boolean;
}

export interface IntegrationsData {
  summary: IntegrationSummary;
  baseUrl: string;
  integrations: IntegrationItem[];
}

export interface SaveIntegrationConfigPayload {
  platformName: string;
  apiKey?: string;
  apiSecret?: string;
  accountId?: string;
  accessToken?: string;
  refreshToken?: string;
  projectId?: string;
  campaignId?: string;
  extraConfig?: string;
  isEnabled: boolean;
  pollIntervalMinutes?: number;
}

