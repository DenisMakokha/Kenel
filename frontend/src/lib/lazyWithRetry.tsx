import { lazy, ComponentType } from 'react';

type ComponentImport<T> = () => Promise<{ default: T }>;

/**
 * Wrapper around React.lazy that handles chunk loading failures gracefully.
 * When a chunk fails to load (e.g., after a new deployment), it will:
 * 1. Retry loading the chunk up to 3 times
 * 2. If all retries fail, reload the page to get fresh assets
 * 
 * This prevents blank pages when navigating after a deployment.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: ComponentImport<T>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const sessionKey = `retry-${componentImport.toString().slice(0, 50)}`;
    const hasRefreshed = sessionStorage.getItem(sessionKey) === 'true';

    try {
      const component = await retryImport(componentImport, retries, interval);
      // Clear the refresh flag on successful load
      sessionStorage.removeItem(sessionKey);
      return component;
    } catch (error) {
      if (!hasRefreshed) {
        // Mark that we're about to refresh to prevent infinite loops
        sessionStorage.setItem(sessionKey, 'true');
        // Force reload to get fresh assets
        window.location.reload();
        // Return a placeholder while reloading
        return { default: (() => null) as unknown as T };
      }
      // If we've already refreshed and it still fails, throw the error
      throw error;
    }
  });
}

async function retryImport<T>(
  importFn: ComponentImport<T>,
  retries: number,
  interval: number
): Promise<{ default: T }> {
  try {
    return await importFn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, interval));
      return retryImport(importFn, retries - 1, interval);
    }
    throw error;
  }
}

export default lazyWithRetry;
