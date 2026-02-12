import { useEffect, useRef, useCallback } from 'react';

const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

const STORAGE_KEY = 'lastActivityTimestamp';
const CHECK_INTERVAL_MS = 15_000; // check every 15 seconds

interface UseInactivityLogoutOptions {
  timeoutMinutes: number;
  onLogout: () => void;
  enabled?: boolean;
}

export function useInactivityLogout({
  timeoutMinutes,
  onLogout,
  enabled = true,
}: UseInactivityLogoutOptions) {
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;
  const firedRef = useRef(false);

  const timeoutMs = timeoutMinutes * 60 * 1000;

  const recordActivity = useCallback(() => {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      // localStorage might be unavailable
    }
  }, []);

  const getLastActivity = useCallback((): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return parseInt(stored, 10);
    } catch {
      // ignore
    }
    return Date.now();
  }, []);

  const checkInactivity = useCallback(() => {
    if (firedRef.current) return;
    const elapsed = Date.now() - getLastActivity();
    if (elapsed >= timeoutMs) {
      firedRef.current = true;
      onLogoutRef.current();
    }
  }, [getLastActivity, timeoutMs]);

  useEffect(() => {
    if (!enabled) return;

    firedRef.current = false;
    recordActivity(); // mark session start

    // Periodic check (works even if setTimeout is throttled in background tabs)
    const intervalId = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    // Record user activity on DOM events
    const handleActivity = () => recordActivity();
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    // Immediately check when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, handleActivity);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, recordActivity, checkInactivity]);
}
