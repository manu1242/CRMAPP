// Standalone session expiry guard to prevent circular dependencies between interceptors and authStore

let isHandlingSessionExpiry = false;

/**
 * Resets the session expiration guard.
 * Call this upon a successful login or session initialization.
 */
export const resetSessionExpiryGuard = () => {
  isHandlingSessionExpiry = false;
};

export const getIsHandlingSessionExpiry = () => {
  return isHandlingSessionExpiry;
};

export const setIsHandlingSessionExpiry = (handling: boolean) => {
  isHandlingSessionExpiry = handling;
};
