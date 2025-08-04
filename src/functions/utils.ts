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
 * Helper function to convert date input to Unix timestamp
 * @param dateInput Date as Excel serial number or YYYY-MM-DD string
 * @returns Unix timestamp in seconds or null if invalid
 */
export function parseDate(dateInput: string | number): { timestamp: number; error?: string } {
  // If it's a number, treat as Excel serial number
  if (typeof dateInput === 'number') {
    const excelEpoch = new Date('1900-01-01').getTime();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const dateObj = new Date(excelEpoch + (dateInput - 2) * millisecondsPerDay);
    return { timestamp: Math.floor(dateObj.getTime() / 1000) };
  }

  // If it's a string, check if it's a number (Excel serial as string) or date string
  const dateStr = dateInput.toString().trim();
  
  // Try to parse as YYYY-MM-DD format first
  const dateStringPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (dateStringPattern.test(dateStr)) {
    const dateObj = new Date(dateStr + 'T00:00:00.000Z'); // Parse as UTC
    if (!isNaN(dateObj.getTime())) {
      return { timestamp: Math.floor(dateObj.getTime() / 1000) };
    }
  }

  // Try to parse as Excel serial number  
  const serialNumber = parseFloat(dateStr);
  if (!isNaN(serialNumber) && serialNumber > 1000) { // Reasonable check for Excel serial numbers
    const excelEpoch = new Date('1900-01-01').getTime();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const dateObj = new Date(excelEpoch + (serialNumber - 2) * millisecondsPerDay);
    return { timestamp: Math.floor(dateObj.getTime() / 1000) };
  }

  return { 
    timestamp: 0, 
    error: 'Invalid date format. Expected YYYY-MM-DD or Excel serial number.' 
  };
}
