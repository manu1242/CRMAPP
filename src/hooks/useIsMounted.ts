import { useRef, useEffect } from 'react';

/**
 * Returns a ref whose `.current` is `true` while the component is mounted
 * and `false` after it unmounts.
 *
 * Use this to guard `setState` calls inside async callbacks that may
 * resolve after the component has already been unmounted, preventing
 * the "Can't perform a React state update on an unmounted component" leak.
 *
 * @example
 * const isMounted = useIsMounted();
 *
 * const handleAction = async () => {
 *   const result = await someApi();
 *   if (!isMounted.current) return; // component gone — bail out
 *   setState(result);
 * };
 */
export function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}
