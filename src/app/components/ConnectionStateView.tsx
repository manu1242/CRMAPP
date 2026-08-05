import React from 'react';
import { useNetwork } from '../../contexts/NetworkContext';
import OfflineScreen from './OfflineScreen';

interface ConnectionStateViewProps {
  isLoading: boolean;
  error: Error | null;
  hasData: boolean;
  onRetry: () => void;
  isRetrying?: boolean;
  children: React.ReactNode;
}

/**
 * Handles layout fallbacks for offline states, server downtime, and connection timeouts.
 * If cached data is present, it allows rendering the children directly (while a global
 * banner notifies the user of offline status). If no data is available, it shows a full
 * OfflineScreen with custom error messaging and retry handlers.
 */
export default function ConnectionStateView({
  isLoading,
  error,
  hasData,
  onRetry,
  isRetrying = false,
  children,
}: ConnectionStateViewProps) {
  const { isConnected } = useNetwork();

  // Scenario 1: Device is offline and no cached data is present in memory/disk
  if (!isConnected && !hasData && !isLoading) {
    return (
      <OfflineScreen
        onRetry={onRetry}
        isRetrying={isRetrying}
        message="You are offline and no cached data is available for this screen. Connect to the internet and retry."
      />
    );
  }

  // Scenario 2: API request failed and no cached data is present (e.g. backend down or connection timeout)
  if (error && !hasData && !isLoading) {
    const isTimeout = error.message?.toLowerCase().includes('timeout') || error.message?.toLowerCase().includes('abort');
    return (
      <OfflineScreen
        onRetry={onRetry}
        isRetrying={isRetrying}
        isBackendDown={true}
        message={
          isTimeout
            ? "The request timed out. The server might be busy or your connection is slow."
            : "The API server appears to be offline or down. Please try again shortly."
        }
      />
    );
  }

  return <>{children}</>;
}
