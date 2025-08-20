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

/**
 * Helper function to get the appropriate API base URL based on environment
 * @returns The base API URL for the current environment
 */
export function getApiUrl(): string {
  const isDevelopment = window?.location?.hostname === 'localhost';

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
