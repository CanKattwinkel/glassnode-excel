// Local date parsing (moved from utils.ts since only used here)
function parseDate(dateInput: string | number): {timestamp: number; error?: string} {
  if (typeof dateInput === 'number') {
    const excelEpoch = new Date('1900-01-01').getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    const dateObj = new Date(excelEpoch + (dateInput - 2) * msPerDay);
    return {timestamp: Math.floor(dateObj.getTime() / 1000)};
  }
  const dateStr = dateInput.toString().trim();
  const dateStringPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (dateStringPattern.test(dateStr)) {
    const dateObj = new Date(dateStr + 'T00:00:00.000Z');
    if (!isNaN(dateObj.getTime())) {
      return {timestamp: Math.floor(dateObj.getTime() / 1000)};
    }
  }
  const serialNumber = parseFloat(dateStr);
  if (!isNaN(serialNumber) && serialNumber > 1000) {
    const excelEpoch = new Date('1900-01-01').getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    const dateObj = new Date(excelEpoch + (serialNumber - 2) * msPerDay);
    return {timestamp: Math.floor(dateObj.getTime() / 1000)};
  }
  return {
    timestamp: 0,
    error: 'Invalid date format. Expected YYYY-MM-DD or Excel serial number.',
  };
}

export type NormalizeDateSuccess = {ok: true; date: Date};
export type NormalizeDateError = {ok: false; error: string};
export type NormalizeDateResult = NormalizeDateSuccess | NormalizeDateError;

/**
 * Normalize Excel date inputs (serial number or YYYY-MM-DD string) into a Date.
 * Discriminated union ensures type safety.
 */
export function normalizeDateInput(input: string | number): NormalizeDateResult {
  const parsed = parseDate(input);
  if (parsed.error) return {ok: false, error: parsed.error};
  return {ok: true, date: new Date(parsed.timestamp * 1000)};
}
