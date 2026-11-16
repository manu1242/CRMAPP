import { useState, useEffect } from 'react';
import { remoteConfigService, RemoteConfigData } from '../Services/ota/remoteConfigService';

export function useRemoteConfig() {
  const [config, setConfig] = useState<RemoteConfigData>(() => remoteConfigService.getConfig());

  useEffect(() => {
    const unsubscribe = remoteConfigService.subscribe((newConfig) => {
      setConfig(newConfig);
    });
    return unsubscribe;
  }, []);

  return {
    config,
    isMaintenanceMode: config.maintenanceMode,
    isForceUpdateRequired: remoteConfigService.isForceUpdateRequired(),
    installedVersion: remoteConfigService.getInstalledAppVersion(),
    isFeatureEnabled: (flag: string) => remoteConfigService.isFeatureEnabled(flag),
    refreshConfig: () => remoteConfigService.fetchRemoteConfig(),
  };
}
