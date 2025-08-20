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
  pick: string | null = null,
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
    type ObjectResponseItem = {t: number; o: Record<string, unknown>};
    type ValueResponseItem = {t: number; v: unknown};
    type ResponseItem = ObjectResponseItem | ValueResponseItem;
    const response = await apiClient.get<ResponseItem[]>(apiUrl, {
      params: {
        ...params,
        source: 'excel-add-in',
      },
      cache: {
        ttl: 3 * 60 * 1000, // 3 min
      },
      id: cacheId,
    });

    // If endDate is not provided and no pick is requested, limit to the first data point
    const rawRows: ResponseItem[] = Array.isArray(response.data) ? response.data : [];
    const rows: ResponseItem[] = endTimestamp == null ? rawRows.slice(0, 1) : rawRows;

    if (rows.length === 0) {
      return [['No data available']];
    }

    const responseType: 'value' | 'object' | null = (() => {
      const first = rows[0];
      if ('v' in first) return 'value';
      if ('o' in first) return 'object';
      return null;
    })();

    if (responseType === null) {
      console.log('Invalid response format - Metric not supported:', rows);
      throw new Error('Invalid response format - Metric not supported');
    }

    if (responseType === 'value') {
      const valueData = rows as ValueResponseItem[];
      if (valueData.length === 1) {
        const value = valueData[0].v;
        return [[value]] as unknown as string[][];
      }
      // Return table format with headers
      const headers = ['Date', metric];

      const dataRows = valueData.map(item => [unixSecondsToYyyyMmDd(item.t), item.v]);

      return [headers, ...dataRows] as unknown as string[][];
    }

    if (responseType === 'object') {
      const objectData = rows as ObjectResponseItem[];
      if (pick !== null) {
        const multi = objectData.length > 1;
        if (!multi) {
          // Single data point: return just the picked value
          const only = objectData[0];
          const val = only.o?.[pick];
          return [[val]] as unknown as string[][];
        }

        // Multiple data points: return Date + picked column
        const headers = ['Date', `${metric}.${pick}`];
        const dataRows = objectData.map(item => [unixSecondsToYyyyMmDd(item.t), item.o?.[pick]]);
        return [headers, ...dataRows] as unknown as string[][];
      }

      // Return table format with headers
      const headers = ['Date', ...Object.keys(objectData[0]?.o || {}).map(it => `${metric}.${it}`)];
      const dataRows = objectData.map(item => [unixSecondsToYyyyMmDd(item.t), ...(Object.values(item.o) as unknown[])]);
      return [headers, ...dataRows] as unknown as string[][];
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
