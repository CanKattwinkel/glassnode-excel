/* global console */

import axios from 'axios';
import {apiClient} from './api';
import {getApiKey, getApiUrl, buildCacheId} from './utils';
import {dateToUnixSeconds, unixSecondsToYyyyMmDd} from './dateUtils';

export async function METRIC(
  asset: string,
  metric: string,
  startDate: Date,
  endDate: Date | null = null,
  parameter1: string | null = null,
  parameter2: string | null = null,
  parameter3: string | null = null,
  parameter4: string | null = null,
): Promise<string[][]> {
  try {
    // Get API key from settings
    const apiKey = await getApiKey();
    if (!apiKey) {
      console.log('API key not found');
      return [['Error: API key not configured. Please set your API key in the task pane.']];
    }

    // Convert provided Date objects to unix timestamps (seconds)
    const startTimestamp = dateToUnixSeconds(startDate);
    const endTimestamp = endDate ? dateToUnixSeconds(endDate) : null;

    // Build URL parameters
    const params = {
      api_key: apiKey,
      a: asset,
      i: '24h',
      s: startTimestamp.toString(),
    };

    if (endTimestamp) {
      params['u'] = endTimestamp.toString();
    }

    // Process optional parameters
    const optionalParams = [parameter1, parameter2, parameter3, parameter4].filter(Boolean);

    for (const param of optionalParams) {
      if (param && typeof param === 'string') {
        const [key, value] = param.split('=');
        if (key && value) {
          params[key.trim()] = value.trim();
        } else {
          console.warn('Invalid parameter format, expected key=value:', param);
        }
      }
    }

    // Use proxy path for development, direct API for production
    const apiUrl = `${getApiUrl()}/v1/metrics${metric}`;

    const {api_key: _, ...cacheKeyParams} = params;

    // Does it even get called? check params, maybe breakpoint.
    const cacheId = buildCacheId(cacheKeyParams, metric);
    type ResponseItem = {v: unknown} | {o: unknown} | Record<string, unknown>;
    const response = await apiClient.get<{data: Array<ResponseItem>}>(apiUrl, {
      params: {
        ...params,
        source: 'excel-add-in',
      },
      cache: {
        ttl: 3 * 60 * 1000, // 3 min
      },
      id: cacheId,
    });

    const responseType: 'value' | 'object' | null | 'unclear' = (() => {
      const first = response.data?.[0];
      if (!first) return null;
      if ('v' in first) return 'value';
      if ('o' in first) return 'object';
      return 'unclear';
    })();

    if (!response.data || !Array.isArray(response.data) || responseType === 'unclear') {
      console.log('Invalid response format - Metric not supported:', response.data);
      throw new Error('Invalid response format - Metric not supported');
    }

    if (responseType === 'value') {
      if (!endDate || response.data.length === 1) {
        const value = response.data[0]?.v;
        return value !== undefined ? [[value]] : [['No data available']];
      }
      // Return table format with headers
      const headers = ['Date', metric];

      const dataRows = response.data.map(item => [unixSecondsToYyyyMmDd(item.t), item.v]);

      return [headers, ...dataRows];
    }

    if (responseType === 'object') {
      // Return table format with headers
      const headers = ['Date', ...Object.keys(response.data[0]?.o || {}).map(it => `${metric}.${it}`)];
      const dataRows = response.data.map(item => [unixSecondsToYyyyMmDd(item.t), ...(Object.values(item.o) as string[])]);
      return [headers, ...dataRows];
    }
  } catch (error) {
    console.error('Error in METRIC function:', error);
    console.log('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
    });

    // Handle axios-specific errors
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return [['Error: 404 metric not found - correct metric endpoint selected?']];
      }
      if (error.response?.status === 429) {
        return [['Error: 429 rate limit exceeded - too many requests to the Glassnode API']];
      }
      return [['Error: HTTP error! status: ' + (error.response?.status || 'unknown')]];
    }

    // Return error message in Excel-compatible format
    return [['Error: ' + (error instanceof Error ? error.message : 'Unknown error')]];
  }
}
