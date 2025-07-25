/* global console, CustomFunctions, OfficeRuntime */

/**
 * Helper function to get the API key from OfficeRuntime.storage
 * @returns The stored API key or null if not found
 */
async function getApiKey(): Promise<string | null> {
  try {
    // Use OfficeRuntime.storage (works across all contexts)
    return await OfficeRuntime.storage.getItem('glassnodeApiKey');
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

/**
 * Fetches asset IDs from Glassnode API
 * @customfunction
 * @param limit Maximum number of assets to return
 * @helpUrl https://github.com/CanKattwinkel/glassnode-excel/
 * @returns Array of asset IDs
 */
export async function ASSETS(limit?: number ): Promise<string[][]> {
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
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log("limit", limit);
    const result = await response.json();
    
    if (!result.data || !Array.isArray(result.data)) {
      throw new Error('Invalid response format');
    }
    
    // Extract IDs and limit the results
    const assetIds = result.data
      .slice(0, limit ?? 50_000)
      .map(asset => asset.id)
      .filter(id => id); // Filter out any undefined/null IDs
        console.log("response", assetIds.map(id => [id]));

    // Return as 2D array for Excel (each ID in its own row)
    return assetIds.map(id => [id]);
    
  } catch (error) {
    console.error('Error fetching asset data:', error);
    // Return error message in Excel-compatible format
    return [['Error: ' + (error instanceof Error ? error.message : 'Unknown error')]];
  }
}

/**
 * Fetches metric data from Glassnode API
 * @customfunction
 * @param asset Asset ID (e.g., "BTC")
 * @param metric Metric path as used in the API (e.g., "/addresses/active_count" - starting with /)
 * @param startDate Start date as string (required, e.g., "2024-01-01")
 * @param endDate End date as string (optional, e.g., "2024-01-31")
 * @helpUrl https://github.com/CanKattwinkel/glassnode-excel/
 * @returns Single value or table with Date and metric columns
 */
export async function METRIC(
  asset: string,
  metric: string,
  startDate: string,
  endDate?: string
): Promise<string[][]> {
  try {
    
    // Get API key from settings
    const apiKey = await getApiKey();
    if (!apiKey) {
      console.log('API key not found');
      return [['Error: API key not configured. Please set your API key in the task pane.']];
    }
    console.log('API key retrieved successfully');

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

    // Convert date strings to timestamps (in seconds)
    // Excel dates are serial numbers representing days since January 1, 1900
    // Excel's epoch is January 1, 1900, but it incorrectly treats 1900 as a leap year
    // So we need to account for this by subtracting 1 day from dates after Feb 28, 1900
    const excelEpoch = new Date('1900-01-01').getTime();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    
    const startDateSerial = parseFloat(startDate);
    if (isNaN(startDateSerial)) {
      console.log('Invalid start date - not a number:', startDate);
      return [['Error: Invalid start date format. Expected Excel date serial number.']];
    }
    
    // Convert Excel serial date to JavaScript Date
    // Subtract 2 days to account for Excel's epoch difference and leap year bug
    const startDateObj = new Date(excelEpoch + (startDateSerial - 2) * millisecondsPerDay);
    const startTimestamp = Math.floor(startDateObj.getTime() / 1000); // Convert to seconds for Unix timestamp
    console.log('Start date converted:', { startDate, startDateSerial, startDateObj, startTimestamp });
    
    let endTimestamp: number | null = null;
    if (endDate) {
      const endDateSerial = parseFloat(endDate);
      if (isNaN(endDateSerial)) {
        console.log('Invalid end date - not a number:', endDate);
        return [['Error: Invalid end date format. Expected Excel date serial number.']];
      }
      
      // Convert Excel serial date to JavaScript Date
      const endDateObj = new Date(excelEpoch + (endDateSerial - 2) * millisecondsPerDay);
      endTimestamp = Math.floor(endDateObj.getTime() / 1000); // Convert to seconds for Unix timestamp
      console.log('End date converted:', { endDate, endDateSerial, endDateObj, endTimestamp });
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

    console.log('URL parameters built:', params.toString());

    // Use proxy path for development, direct API for production
    const isDevelopment = window.location.hostname === 'localhost';
    const apiUrl = isDevelopment
      ? `/api/glassnode/v1/metrics${metric}?${params.toString()}`
      : `https://api.glassnode.com/v1/metrics${metric}?${params.toString()}`;

    console.log('API URL constructed:', { isDevelopment, apiUrl });

    const response = await fetch(apiUrl);
    console.log('Fetch response received:', { status: response.status, ok: response.ok });
    
    if (!response.ok) {
      console.log('HTTP error occurred:', response.status);
      if (response.status === 404) {
        throw new Error('404 metric not found - correct metric endpoint selected?');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Response parsed:', { resultType: typeof result, isArray: Array.isArray(result), length: result?.length, firstItem: result?.[0] });

    if (!Array.isArray(result)) {
      console.log('Invalid response format - not an array:', result);
      throw new Error('Invalid response format');
    }
    
    // If only one date specified or only one data point returned, return single value
    if (!endDate || result.length === 1) {
      const value = result[0]?.v;
      console.log('Returning single value:', { endDate: !!endDate, resultLength: result.length, value, firstItem: result[0] });
      return value !== undefined ? [[value]] : [['No data available']];
    }

    // Return table format with headers
    const metricName = metric.split('/').pop()?.replace(/_/g, '.') || 'value';
    const headers = ['Date', metricName];
    
    const dataRows = result.map(item => [
      new Date(item.t * 1000).toISOString().split('T')[0], // Convert Unix timestamp to YYYY-MM-DD format
      item.v  // Convert value to string
    ]);

    console.log('Returning table format:', { 
      metricName, 
      headers, 
      dataRowsLength: dataRows.length, 
      firstDataRow: dataRows[0], 
      lastDataRow: dataRows[dataRows.length - 1] 
    });

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
