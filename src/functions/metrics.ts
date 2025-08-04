/* global console, CustomFunctions */

import { getApiKey, parseDate } from './utils';

/**
 * Fetches metric data from Glassnode API
 * @customfunction
 * @param asset Asset ID (e.g., "BTC")
 * @param metric Metric path as used in the API (e.g., "/addresses/active_count" - starting with /)
 * @param startDate Start date as Excel serial number or YYYY-MM-DD string (required, e.g., "2024-01-01" or 45292)
 * @param [endDate] End date as Excel serial number or YYYY-MM-DD string (optional, exclusive - data up to but not including this date, e.g., "2024-01-31" or 45321)
 * @param [parameter1] Optional parameter in key=value format (e.g., "e=binance", "miner=FoundryUSAPool", "c=usd", "network=base", ...)
 * @param [parameter2] Optional parameter in key=value format (e.g., "e=binance", "miner=FoundryUSAPool", "c=usd", "network=base", ...)
 * @param [parameter3] Optional parameter in key=value format (e.g., "e=binance", "miner=FoundryUSAPool", "c=usd", "network=base", ...)
 * @param [parameter4] Optional parameter in key=value format (e.g., "e=binance", "miner=FoundryUSAPool", "c=usd", "network=base", ...)
 * @helpUrl https://github.com/CanKattwinkel/glassnode-excel/
 * @returns Single value or table with Date and metric columns
 */
export async function METRIC(
  asset: string,
  metric: string,
  startDate: string | number,
  endDate: string | number | null = null,
  parameter1: string | null = null,
  parameter2: string| null = null,
  parameter3: string| null = null,
  parameter4: string| null = null
): Promise<string[][]> {
  try {
    
    // Get API key from settings
    const apiKey = await getApiKey();
    if (!apiKey) {
      console.log('API key not found');
      return [['Error: API key not configured. Please set your API key in the task pane.']];
    }

    // Validate required parameters
    if (!asset || !metric || !startDate) {
      console.log('Missing required parameters:', { asset: !!asset, metric: !!metric, startDate: !!startDate });
      return [['Error: asset, metric, and startDate are required parameters']];
    }

    // Validate metric path format
    if (!metric.startsWith('/')) {
      console.log('Invalid metric path format:', metric);
      return [['Error: Invalid path, make sure to use API endpoint notation like /addresses/active_count']];
    }

    // Convert start date to timestamp
    const startDateResult = parseDate(startDate);
    if (startDateResult.error) {
      console.log('Invalid start date:', startDate, startDateResult.error);
      return [['Error: ' + startDateResult.error]];
    }
    const startTimestamp = startDateResult.timestamp;
    
    let endTimestamp: number | null = null;
    if (endDate !== null) {
      const endDateResult = parseDate(endDate);
      if (endDateResult.error) {
        console.log('Invalid end date:', endDate, endDateResult.error);
        return [['Error: ' + endDateResult.error]];
      }
      endTimestamp = endDateResult.timestamp;
      console.log('End date converted:', { endDate, endTimestamp });
    }

    // Build URL parameters
    const params = new URLSearchParams({
      api_key: apiKey,
      a: asset,
      i: '24h',
      s: startTimestamp.toString()
    });

    if (endTimestamp) {
      params.append('u', endTimestamp.toString());
    }

    // Process optional parameters
    const optionalParams = [parameter1, parameter2, parameter3, parameter4].filter(Boolean);
    
    for (const param of optionalParams) {
      if (param && typeof param === 'string') {
        const [key, value] = param.split('=');
        if (key && value) {
          params.append(key.trim(), value.trim());
        } else {
          console.warn('Invalid parameter format, expected key=value:', param);
        }
      }
    }

    // Use proxy path for development, direct API for production
    const isDevelopment = window?.location?.hostname === 'localhost';
    const apiUrl = isDevelopment
      ? `/api/glassnode/v1/metrics${metric}?${params.toString()}`
      : `https://api.glassnode.com/v1/metrics${metric}?${params.toString()}`;

    const response = await fetch(apiUrl);    
    if (!response.ok) {
      console.log('HTTP error occurred:', response.status);
      if (response.status === 404) {
        throw new Error('404 metric not found - correct metric endpoint selected?');
      }
      if (response.status === 429) {
        throw new Error('429 rate limit exceeded - too many requests to the Glassnode API');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!Array.isArray(result)) {
      console.log('Invalid response format - not an array:', result);
      throw new Error('Invalid response format');
    }
    
    // If only one date specified or only one data point returned, return single value
    if (!endDate || result.length === 1) {
      const value = result[0]?.v;
      return value !== undefined ? [[value]] : [['No data available']];
    }

    // Return table format with headers
    const metricName = metric.split('/').pop()?.replace(/_/g, '.') || 'value';
    const headers = ['Date', metricName];
    
    const dataRows = result.map(item => [
      new Date(item.t * 1000).toISOString().split('T')[0], // Convert Unix timestamp to YYYY-MM-DD format
      item.v  // Convert value to string
    ]);

    return [headers, ...dataRows];
    
  } catch (error) {
    console.error('Error in METRIC function:', error);
    console.log('Error details:', { 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error
    });
    // Return error message in Excel-compatible format
    return [['Error: ' + (error instanceof Error ? error.message : 'Unknown error')]];
  }
}
