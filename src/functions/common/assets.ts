/* global console */

import axios from 'axios';
import { getApiKey, getApiUrl } from './utils';
import { apiClient } from './api';
// Create cached axios instance with localStorage

export async function ASSETS(limit: number = null): Promise<string[][]> {
  try {
    // Get API key from settings
    const apiKey = await getApiKey();
    if (!apiKey) {
      return [['Error: API key not configured. Please set your API key in the task pane.']];
    }
    
    const cacheId = `assets_cache`;
    const response = await apiClient.get(`${getApiUrl()}/v1/metadata/assets`, {
      params: { 
        api_key: apiKey,
        source: "excel-add-in"
      },
      cache: {
        ttl: 60 * 60 * 1000, // 1 hour
      },
      id: cacheId
    });
    
    if (!response.data.data || !Array.isArray(response.data.data)) {
      throw new Error('Invalid response format');
    }
    
    // Extract IDs and limit the results
    const assetIds = response.data.data
      .slice(0, limit ?? 50_000)
      .map(asset => asset.id)
      .filter(id => id); // Filter out any undefined/null/"" IDs

    // Return as 2D array for Excel (each ID in its own row)
    return assetIds.map(id => [id]);
    
  } catch (error) {
    console.error('Error fetching asset data:', error);
    
    // Handle axios-specific errors
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        return [['Error: 429 rate limit exceeded - too many requests to the Glassnode API']];
      }
      return [['Error: HTTP error! status: ' + (error.response?.status || 'unknown')]];
    }
    
    // Return error message in Excel-compatible format
    return [['Error: ' + (error instanceof Error ? error.message : 'Unknown error')]];
  }
}
