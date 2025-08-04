/* global console */

import { getApiKey } from './utils';

export async function ASSETS(limit: number = null ): Promise<string[][]> {
  try {
    // Get API key from settings
    const apiKey = await getApiKey();
    if (!apiKey) {
      return [['Error: API key not configured. Please set your API key in the task pane.']];
    }
    
    // Use proxy path for development, direct API for production
    const isDevelopment = window?.location?.hostname === 'localhost';
    const apiUrl = isDevelopment 
      ? `/api/glassnode/v1/metadata/assets?api_key=${apiKey}`
      : `https://api.glassnode.com/v1/metadata/assets?api_key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        "X-Requested-By": "Excel-Addin",
        "User-Agent": "Excel-Addin/1.0"
      }
    });
    
    if (!response.ok) {
      console.log('HTTP error occurred:', response.status);
      if (response.status === 429) {
        throw new Error('429 rate limit exceeded - too many requests to the Glassnode API');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    
    if (!result.data || !Array.isArray(result.data)) {
      throw new Error('Invalid response format');
    }
    
    // Extract IDs and limit the results
    const assetIds = result.data
      .slice(0, limit ?? 50_000)
      .map(asset => asset.id)
      .filter(id => id); // Filter out any undefined/null/"" IDs

    // Return as 2D array for Excel (each ID in its own row)
    return assetIds.map(id => [id]);
    
  } catch (error) {
    console.error('Error fetching asset data:', error);
    // Return error message in Excel-compatible format
    return [['Error: ' + (error instanceof Error ? error.message : 'Unknown error')]];
  }
}
