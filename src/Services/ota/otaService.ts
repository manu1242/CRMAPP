import * as Updates from 'expo-updates';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OtaStatus,
  OtaErrorReason,
  OtaUpdateInfo,
  OtaServiceState,
  OtaConfig,
  OtaCheckResult,
  OtaFetchResult,
} from './otaTypes';

// AsyncStorage Keys
const STORAGE_KEYS = {
  CRASH_COUNT: '@ota_consecutive_crash_count',
  LAST_UPDATE_ID: '@ota_last_applied_update_id',
  DISMISSED_UPDATE_ID: '@ota_dismissed_update_id',
  LAST_CHECK_TIMESTAMP: '@ota_last_check_timestamp',
};

const DEFAULT_CONFIG: OtaConfig = {
  checkOnLaunch: true,
  checkOnForeground: true,
  foregroundCheckIntervalMs: 15 * 60 * 1000, // 15 minutes
  timeoutMs: 12000, // 12 seconds
  autoReloadPolicy: 'prompt',
  crashLoopThreshold: 3,
};

type StateChangeListener = (state: OtaServiceState) => void;

class OtaService {
  private config: OtaConfig = { ...DEFAULT_CONFIG };
  private listeners: Set<StateChangeListener> = new Set();

  private isCheckingMutex = false;
  private isDownloadingMutex = false;
  private isCriticalOperationActive = false;
  private isCrashLoopDetected = false;

  private state: OtaServiceState = {
    status: 'idle',
    isUpdateAvailable: false,
    isUpdateReady: false,
    isDownloading: false,
    progress: 0,
    lastCheckedAt: null,
    currentUpdate: this.getCurrentUpdateInfo(),
    availableUpdate: null,
    error: null,
    errorReason: null,
  };

  constructor() {
    this.initCrashGuard();
  }

  // ── Public Accessors ────────────────────────────────────────────────────────

  public getState(): OtaServiceState {
    return { ...this.state };
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setCriticalOperation(active: boolean): void {
    this.isCriticalOperationActive = active;
  }

  public isEnabled(): boolean {
    // expo-updates is disabled in local dev or Expo Go
    if (__DEV__) return false;
    return Boolean(Updates.isEnabled);
  }

  // ── State Dispatcher ────────────────────────────────────────────────────────

  private updateState(partial: Partial<OtaServiceState>): void {
    this.state = {
      ...this.state,
      ...partial,
      currentUpdate: this.getCurrentUpdateInfo(),
    };
    this.listeners.forEach((listener) => {
      try {
        listener(this.getState());
      } catch (err) {
        console.warn('[OTA Service] Listener error:', err);
      }
    });
  }

  // ── Crash Loop Guard ────────────────────────────────────────────────────────

  private async initCrashGuard(): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      const rawCount = await AsyncStorage.getItem(STORAGE_KEYS.CRASH_COUNT);
      const count = rawCount ? parseInt(rawCount, 10) : 0;

      if (count >= this.config.crashLoopThreshold) {
        console.warn(`[OTA Service] Crash loop protection activated! (Consecutive crashes: ${count})`);
        this.isCrashLoopDetected = true;
        this.updateState({
          status: 'error',
          error: 'Application crash loop detected. Auto-updates paused for stability.',
          errorReason: 'crash-loop-prevention',
        });
        return;
      }

      // Increment crash counter on launch
      await AsyncStorage.setItem(STORAGE_KEYS.CRASH_COUNT, String(count + 1));

      // After 15 seconds of stable execution, clear the crash counter
      setTimeout(async () => {
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.CRASH_COUNT, '0');
        } catch {
          // ignore
        }
      }, 15000);
    } catch {
      // Non-blocking
    }
  }

  // ── Inspect Currently Running Bundle ────────────────────────────────────────

  public getCurrentUpdateInfo(): OtaUpdateInfo {
    const isEmbedded = Updates.isEmbeddedLaunch ?? true;
    const isEmergency = Updates.isEmergencyLaunch ?? false;
    const emergencyReason = Updates.emergencyLaunchReason ?? null;

    let createdAtStr: string | null = null;
    try {
      if (Updates.createdAt) {
        createdAtStr = Updates.createdAt.toISOString();
      }
    } catch {
      createdAtStr = null;
    }

    return {
      updateId: Updates.updateId ?? null,
      createdAt: createdAtStr,
      manifest: Updates.manifest ?? null,
      channel: Updates.channel ?? null,
      runtimeVersion: Updates.runtimeVersion ?? null,
      isEmbeddedLaunch: isEmbedded,
      isEmergencyLaunch: isEmergency,
      emergencyLaunchReason: emergencyReason,
    };
  }

  // ── Check for Updates ───────────────────────────────────────────────────────

  public async checkForUpdate(isManual = false): Promise<OtaCheckResult> {
    if (this.isCheckingMutex) {
      return { isAvailable: this.state.isUpdateAvailable, reason: 'Check already in progress' };
    }

    if (!this.isEnabled()) {
      const reason = __DEV__
        ? 'OTA is disabled in development mode'
        : 'expo-updates is disabled or not configured';
      this.updateState({ status: 'disabled', error: null, errorReason: 'dev-mode' });
      return { isAvailable: false, reason };
    }

    if (this.isCrashLoopDetected && !isManual) {
      return { isAvailable: false, reason: 'Crash loop protection active' };
    }

    // Verify network connectivity before checking
    const net = await NetInfo.fetch();
    if (!net.isConnected || !net.isInternetReachable) {
      this.updateState({
        status: 'idle',
        error: 'Offline - cannot check for updates',
        errorReason: 'offline',
      });
      return { isAvailable: false, reason: 'No internet connection' };
    }

    this.isCheckingMutex = true;
    this.updateState({ status: 'checking', error: null, errorReason: null });

    try {
      // Wrap call in timeout protection
      const checkPromise = Updates.checkForUpdateAsync();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Update check request timed out')), this.config.timeoutMs)
      );

      const updateCheck = await Promise.race([checkPromise, timeoutPromise]);
      const nowStr = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECK_TIMESTAMP, nowStr);

      if (updateCheck.isAvailable) {
        const manifest = updateCheck.manifest as any;
        const updateId = manifest?.id || manifest?.metadata?.updateId || 'new-update';
        const createdAt = manifest?.createdAt || nowStr;
        const isMandatory = Boolean(manifest?.extra?.isMandatory || manifest?.metadata?.isMandatory);
        const releaseNotes = manifest?.extra?.releaseNotes || manifest?.metadata?.releaseNotes || '';

        // Check if user already dismissed this specific optional update
        const dismissedId = await AsyncStorage.getItem(STORAGE_KEYS.DISMISSED_UPDATE_ID);
        const isDismissed = dismissedId === updateId && !isMandatory && !isManual;

        const availableInfo: OtaUpdateInfo = {
          updateId,
          createdAt,
          manifest,
          channel: Updates.channel ?? null,
          runtimeVersion: Updates.runtimeVersion ?? null,
          isEmbeddedLaunch: false,
          isEmergencyLaunch: false,
          emergencyLaunchReason: null,
          isMandatory,
          releaseNotes,
        };

        this.updateState({
          status: isDismissed ? 'idle' : 'available',
          isUpdateAvailable: true,
          availableUpdate: availableInfo,
          lastCheckedAt: nowStr,
        });

        return { isAvailable: true, manifest };
      } else {
        this.updateState({
          status: 'up-to-date',
          isUpdateAvailable: false,
          availableUpdate: null,
          lastCheckedAt: nowStr,
        });
        return { isAvailable: false, reason: 'App is up to date' };
      }
    } catch (err: any) {
      console.warn('[OTA Service] Update check failed:', err?.message || err);
      const isTimeout = String(err?.message || '').toLowerCase().includes('time');
      this.updateState({
        status: 'error',
        error: err?.message || 'Failed to check for updates',
        errorReason: isTimeout ? 'timeout' : 'server-error',
      });
      return { isAvailable: false, reason: err?.message };
    } finally {
      this.isCheckingMutex = false;
    }
  }

  // ── Download Update ─────────────────────────────────────────────────────────

  public async downloadUpdate(): Promise<OtaFetchResult> {
    if (this.isDownloadingMutex) {
      return { isNew: false };
    }

    if (!this.isEnabled()) {
      return { isNew: false };
    }

    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      this.updateState({
        status: 'error',
        error: 'Cannot download update while offline',
        errorReason: 'offline',
      });
      return { isNew: false };
    }

    this.isDownloadingMutex = true;
    this.updateState({
      status: 'downloading',
      isDownloading: true,
      progress: 10,
      error: null,
      errorReason: null,
    });

    try {
      // Simulate progress ticks while background bundle is transferring
      const progressTimer = setInterval(() => {
        this.updateState({
          progress: Math.min(this.state.progress + 15, 90),
        });
      }, 500);

      const fetchPromise = Updates.fetchUpdateAsync();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Update download request timed out')), this.config.timeoutMs * 2.5)
      );

      const fetchResult = await Promise.race([fetchPromise, timeoutPromise]);
      clearInterval(progressTimer);

      if (fetchResult.isNew) {
        this.updateState({
          status: 'ready',
          isDownloading: false,
          isUpdateReady: true,
          progress: 100,
        });

        // If mandatory and not busy with critical operation, can reload immediately
        if (
          this.state.availableUpdate?.isMandatory &&
          !this.isCriticalOperationActive &&
          this.config.autoReloadPolicy === 'immediate-if-mandatory'
        ) {
          await this.reloadApp();
        }

        return { isNew: true, manifest: fetchResult.manifest };
      } else {
        this.updateState({
          status: 'up-to-date',
          isDownloading: false,
          progress: 100,
        });
        return { isNew: false };
      }
    } catch (err: any) {
      console.warn('[OTA Service] Download failed:', err?.message || err);
      const isTimeout = String(err?.message || '').toLowerCase().includes('time');
      this.updateState({
        status: 'error',
        isDownloading: false,
        error: err?.message || 'Failed to download update bundle',
        errorReason: isTimeout ? 'timeout' : 'server-error',
      });
      return { isNew: false };
    } finally {
      this.isDownloadingMutex = false;
    }
  }

  // ── Apply Update / Reload App ───────────────────────────────────────────────

  public async reloadApp(force = false): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    if (this.isCriticalOperationActive && !force) {
      console.warn('[OTA Service] Reload deferred: User is completing a critical operation');
      return false;
    }

    try {
      console.log('[OTA Service] Applying downloaded OTA update. Reloading runtime...');
      if (this.state.availableUpdate?.updateId) {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE_ID, this.state.availableUpdate.updateId);
      }
      await Updates.reloadAsync();
      return true;
    } catch (err: any) {
      console.error('[OTA Service] Failed to reload runtime:', err);
      this.updateState({
        status: 'error',
        error: 'Failed to reload application',
        errorReason: 'unknown',
      });
      return false;
    }
  }

  // ── Dismiss Optional Update ─────────────────────────────────────────────────

  public async dismissUpdate(): Promise<void> {
    const updateId = this.state.availableUpdate?.updateId;
    if (updateId) {
      await AsyncStorage.setItem(STORAGE_KEYS.DISMISSED_UPDATE_ID, updateId);
    }
    this.updateState({
      status: 'idle',
      isUpdateAvailable: false,
    });
  }
}

export const otaService = new OtaService();
