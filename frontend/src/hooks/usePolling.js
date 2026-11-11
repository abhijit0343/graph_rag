/**
 * Hook to poll an asynchronous task at a regular interval while enabled.
 */

import { useEffect, useRef } from 'react';

export function usePolling(callback, delay, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || delay === null) return;

    let isMounted = true;

    const tick = async () => {
      if (isMounted && savedCallback.current) {
        try {
          await savedCallback.current();
        } catch (e) {
          // Handled within callback
        }
      }
    };

    // Initial immediate call
    tick();

    const id = setInterval(tick, delay);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [delay, enabled]);
}

