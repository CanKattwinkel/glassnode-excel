/* global console, CustomFunctions, OfficeRuntime */

import { ASSETS as ASSETS_IMPL } from './assets';
import { METRIC as METRIC_IMPL } from './metrics';

/**
 * Fetches asset IDs from Glassnode API
 * @customfunction
 * @param {number} [limit] Maximum number of assets to return
 * @helpUrl https://github.com/CanKattwinkel/glassnode-excel/
 * @returns Array of asset IDs
 */
export async function ASSETS(limit: number = null): Promise<string[][]> {
  return ASSETS_IMPL(limit);
}

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
  return METRIC_IMPL(asset, metric, startDate, endDate, parameter1, parameter2, parameter3, parameter4);
}
