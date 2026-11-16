/**
 * Over-The-Air (OTA) Update System Types
 * Expo EAS Update & expo-updates integration
 */

export type OtaStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'up-to-date'
  | 'error'
  | 'disabled';

export type OtaErrorReason =
  | 'offline'
  | 'timeout'
  | 'server-error'
  | 'dev-mode'
  | 'disabled'
  | 'crash-loop-prevention'
  | 'unknown';

export interface OtaUpdateInfo {
  updateId: string | null;
  createdAt: string | null;
  manifest: any | null;
  channel: string | null;
  runtimeVersion: string | null;
  isEmbeddedLaunch: boolean;
  isEmergencyLaunch: boolean;
  emergencyLaunchReason: string | null;
  isMandatory?: boolean;
  releaseNotes?: string;
}

export interface OtaCheckResult {
  isAvailable: boolean;
  manifest?: any;
  reason?: string;
}

export interface OtaFetchResult {
  isNew: boolean;
  manifest?: any;
}

export interface OtaProgress {
  total: number;
  received: number;
  percent: number;
}

export interface OtaServiceState {
  status: OtaStatus;
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  isDownloading: boolean;
  progress: number; // 0 to 100
  lastCheckedAt: string | null;
  currentUpdate: OtaUpdateInfo;
  availableUpdate: OtaUpdateInfo | null;
  error: string | null;
  errorReason: OtaErrorReason | null;
}

export interface OtaConfig {
  checkOnLaunch: boolean;
  checkOnForeground: boolean;
  foregroundCheckIntervalMs: number; // Default 15 mins (900,000ms)
  timeoutMs: number; // Network timeout (e.g. 12,000ms)
  autoReloadPolicy: 'prompt' | 'next-restart' | 'immediate-if-mandatory';
  crashLoopThreshold: number; // Max consecutive launch crashes before disabling auto-reload
}
