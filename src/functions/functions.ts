/* global console */

import {ASSETS as ASSETS_IMPL} from './common/assets';
import {METRIC as METRIC_IMPL} from './common/metrics';
import {normalizeDateInput} from './common/normalizeDateInput';

const ADDIN_VERSION = '0.1.0';

/**
 * Fetches asset IDs from Glassnode API
 * @customfunction
 * @param {number} [limit] Maximum number of assets to return
 * @helpUrl https://github.com/CanKattwinkel/glassnode-excel/
 * @returns Array of asset IDs
 */
export async function ASSETS(limit: number = null): Promise<string[][]> {
  console.log(`[GlassnodeExcel v${ADDIN_VERSION}] ASSETS`, {limit});
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
  parameter2: string | null = null,
  parameter3: string | null = null,
  parameter4: string | null = null,
): Promise<string[][]> {
  console.log(`[GlassnodeExcel v${ADDIN_VERSION}] METRIC`, {
    asset,
    metric,
    startDate,
    endDate,
    parameter1,
    parameter2,
    parameter3,
    parameter4,
  });
  // Validate required parameters early (UX layer responsibility)
  if (!asset || !metric || !startDate) {
    return [['Error: asset, metric, and startDate are required parameters']];
  }
  if (!metric.startsWith('/')) {
    return [['Error: Invalid path, make sure to use API endpoint notation like /addresses/active_count']];
  }
  const startRes = normalizeDateInput(startDate);
  if (startRes.ok === false) return [[`Error: ${startRes.error}`]];
  if (endDate !== null && endDate !== undefined) {
    const endRes = normalizeDateInput(endDate);
    if (endRes.ok === false) return [[`Error: ${endRes.error}`]];
    return METRIC_IMPL(asset, metric, startRes.date, endRes.date, parameter1, parameter2, parameter3, parameter4);
  }
  return METRIC_IMPL(asset, metric, startRes.date, null, parameter1, parameter2, parameter3, parameter4);
}
