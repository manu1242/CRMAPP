import { useState, useEffect, useCallback } from 'react';
import { otaService } from '../Services/ota/otaService';
import { OtaServiceState, OtaCheckResult, OtaFetchResult } from '../Services/ota/otaTypes';

export function useOtaUpdate() {
  const [state, setState] = useState<OtaServiceState>(() => otaService.getState());

  useEffect(() => {
    const unsubscribe = otaService.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const checkForUpdate = useCallback(async (isManual = false): Promise<OtaCheckResult> => {
    return otaService.checkForUpdate(isManual);
  }, []);

  const downloadUpdate = useCallback(async (): Promise<OtaFetchResult> => {
    return otaService.downloadUpdate();
  }, []);

  const applyUpdate = useCallback(async (force = false): Promise<boolean> => {
    return otaService.reloadApp(force);
  }, []);

  const dismissUpdate = useCallback(async (): Promise<void> => {
    return otaService.dismissUpdate();
  }, []);

  return {
    ...state,
    isEnabled: otaService.isEnabled(),
    checkForUpdate,
    downloadUpdate,
    applyUpdate,
    dismissUpdate,
  };
}
