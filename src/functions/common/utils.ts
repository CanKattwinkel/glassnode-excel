/* global console, OfficeRuntime */

/**
 * Helper function to get the API key from OfficeRuntime.storage
 * @returns The stored API key or null if not found
 */
export async function getApiKey(): Promise<string | null> {
  try {
    // Use OfficeRuntime.storage (works across all contexts)
    return await OfficeRuntime.storage.getItem('glassnodeApiKey');
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

export function isDevEnv() {
  return window?.location?.hostname === 'localhost';
}

/**
 * Helper function to get the appropriate API base URL based on environment
 * @returns The base API URL for the current environment
 */
export function getApiUrl(): string {
  const isDevelopment = isDevEnv();

  if (isDevelopment) {
    return '/api/glassnode';
  } else {
    return 'https://api.glassnode.com';
  }
}

export function buildCacheId(filteredParams: object, metric: string) {
  const relevantParams = {...filteredParams, metric};
  const sorted = Object.keys(relevantParams)
    .sort()
    .reduce((obj, key) => {
      obj[key] = relevantParams[key];
      return obj;
    }, {});
  return `metrics-${JSON.stringify(sorted)}`;
}

export function buildHeaders(objectData: {t: number; o: Record<string, unknown>}[], metric: string) {
  const allKeys = new Set<string>();
  for (const item of objectData) {
    if (item.o) {
      Object.keys(item.o).forEach(k => allKeys.add(k));
    }
  }
  const keys = Array.from(allKeys).sort();
  const headers = ['Date', ...keys.map(it => `${metric}.${it}`)];
  return {headers, keys};
}