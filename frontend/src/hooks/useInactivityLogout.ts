import { useEffect, useRef, useCallback } from 'react';

const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onLogoutRef.current();
    }, timeoutMinutes * 60 * 1000);
  }, [timeoutMinutes]);

  useEffect(() => {
    if (!enabled) return;

    resetTimer();

    const handleActivity = () => resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    // Also reset on visibility change (tab focus)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        resetTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, handleActivity);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, resetTimer]);
}
