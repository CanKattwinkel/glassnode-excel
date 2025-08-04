import { METRIC } from './metrics';
import { apiClient } from './api';
import MockAdapter from 'axios-mock-adapter';

describe('METRIC function', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    
    // Create MockAdapter for the cached axios instance
    mock = new MockAdapter(apiClient);
    (global as any).OfficeRuntime.storage.getItem.mockReturnValue('test-api-key');
    
    // Clear the cache storage before each test
    try {
      (apiClient as any).storage?.clear?.();
    } catch (e) {
      // Ignore errors if storage doesn't exist
    }
  });

  afterEach(() => {
    mock.restore();
  });

  it('should return single value for single data point', async () => {
    const mockResponse = [
      { t: 1640995200, v: 100.5 }
    ];

    mock.onGet('/api/glassnode/v1/metrics/addresses/active_count').reply(200, mockResponse);

    // Excel date serial number for 2022-01-01
    const excelDate = '44562';
    const result = await METRIC('BTC', '/addresses/active_count', excelDate);

    expect(result).toEqual([[100.5]]);
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC'
      })
    );
  });

  it('should return table format for date range', async () => {
    const mockResponse = [
      { t: 1640995200, v: 100.5 },
      { t: 1641081600, v: 102.3 },
    ];

    mock.onGet('/api/glassnode/v1/metrics/addresses/active_count').reply(200, mockResponse);

    // Excel date serial numbers for 2022-01-01 and 2022-01-02
    const startDate = '44562';
    const endDate = '44563';
    const result = await METRIC('BTC', '/addresses/active_count', startDate, endDate);

    expect(result).toEqual([
      ['Date', 'active.count'],
      ['2022-01-01', 100.5],
      ['2022-01-02', 102.3],
    ]);
  });

  it('should return error when API key is not configured', async () => {
    (global as any).OfficeRuntime.storage.getItem.mockReturnValue(null);

    const result = await METRIC('BTC', '/addresses/active_count', '44562');

    expect(result).toEqual([['Error: API key not configured. Please set your API key in the task pane.']]);
    expect(mock.history.get).toHaveLength(0);
  });

  it('should return error when required parameters are missing', async () => {
    const result = await METRIC('', '/addresses/active_count', '44562');

    expect(result).toEqual([['Error: asset, metric, and startDate are required parameters']]);
    expect(mock.history.get).toHaveLength(0);
  });

  it('should return error when date format is invalid', async () => {
    const result = await METRIC('BTC', '/addresses/active_count', 'invalid-date');

    expect(result).toEqual([['Error: Invalid date format. Expected YYYY-MM-DD or Excel serial number.']]);
    expect(mock.history.get).toHaveLength(0);
  });

  it('should return error when metric path does not start with /', async () => {
    const result = await METRIC('BTC', 'addresses/active_count', '44562');

    expect(result).toEqual([['Error: Invalid path, make sure to use API endpoint notation like /addresses/active_count']]);
    expect(mock.history.get).toHaveLength(0);
  });

  it('should return error when required parameters are missing', async () => {
    const result = await METRIC('', '/addresses/active_count', '44562');

    expect(result).toEqual([['Error: asset, metric, and startDate are required parameters']]);
    expect(mock.history.get).toHaveLength(0);
  });

  it('should return error when date format is invalid', async () => {
    const result = await METRIC('BTC', '/addresses/active_count', 'invalid-date');

    expect(result).toEqual([['Error: Invalid date format. Expected YYYY-MM-DD or Excel serial number.']]);
    expect(mock.history.get).toHaveLength(0);
  });

  it('should return error when metric path does not start with /', async () => {
    const result = await METRIC('BTC', 'addresses/active_count', '44562');

    expect(result).toEqual([['Error: Invalid path, make sure to use API endpoint notation like /addresses/active_count']]);
    expect(mock.history.get).toHaveLength(0);
  });

  it('should construct correct API URL with parameters', async () => {
    const mockResponse = [{ t: 1640995200, v: 100.5 }];

    mock.onGet('/api/glassnode/v1/metrics/addresses/active_count').reply(200, mockResponse);

    const startDate = '44562'; // 2022-01-01
    const endDate = '44563';   // 2022-01-02

    await METRIC('BTC', '/addresses/active_count', startDate, endDate);

    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC',
        i: '24h',
        s: '1640995200',
        u: '1641081600'
      })
    );
  });

  it('should fetch BTC price data for January 2024 date range', async () => {
    // Mock response data for BTC price from 2024-01-01 to 2024-01-30
    const mockResponse = [
      { t: 1704067200, v: 42167.84 },      { t: 1704153600, v: 44172.56 },      { t: 1704240000, v: 44294.32 },      { t: 1706572800, v: 43156.78 },    ];

    mock.onGet('/api/glassnode/v1/metrics/market/price_usd_close').reply(200, mockResponse);

    // Excel date serial numbers for 2024-01-01 and 2024-01-30
    // 2024-01-01 = 45292, 2024-01-30 = 45321
    const startDate = '45292'; // 2024-01-01
    const endDate = '45321';   // 2024-01-30

    const result = await METRIC('BTC', '/market/price_usd_close', startDate, endDate);

    // Verify the result format
    expect(result).toEqual([
      ['Date', 'price.usd.close'],
      ['2024-01-01', 42167.84],
      ['2024-01-02', 44172.56],
      ['2024-01-03', 44294.32],
      ['2024-01-30', 43156.78],
    ]);

    // Verify the API was called with correct parameters
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC',
        i: '24h',
        s: '1704067200',
        u: '1706572800'
      })
    );
  });

  it('should handle optional parameters correctly', async () => {
    const mockResponse = [{ t: 1704067200, v: 100.5 }];

    mock.onGet('/api/glassnode/v1/metrics/addresses/active_count').reply(200, mockResponse);

    const startDate = '45292'; // 2024-01-01

    await METRIC('BTC', '/addresses/active_count', startDate, undefined, 'tier=1', 'currency=USD');

    // Verify the API was called with optional parameters
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC',
        i: '24h',
        s: '1704067200',
        tier: '1',
        currency: 'USD'
      })
    );
  });

  it('should handle date strings (YYYY-MM-DD format) for single date', async () => {
    const mockResponse = [{ t: 1704067200, v: 45123.45 }];

    mock.onGet('/api/glassnode/v1/metrics/market/price_usd_close').reply(200, mockResponse);

    // Test with date string instead of Excel serial number
    const result = await METRIC('BTC', '/market/price_usd_close', '2024-01-01');

    expect(result).toEqual([[45123.45]]);

    // Verify the API was called with correct timestamp for 2024-01-01
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC',
        i: '24h',
        s: '1704067200'
      })
    );
  });

  it('should handle date strings (YYYY-MM-DD format) for date range', async () => {
    const mockResponse = [
      { t: 1704067200, v: 42167.84 },      { t: 1704153600, v: 44172.56 },      { t: 1706572800, v: 43156.78 },    ];

    mock.onGet('/api/glassnode/v1/metrics/market/price_usd_close').reply(200, mockResponse);

    // Test with date strings instead of Excel serial numbers
    const result = await METRIC('BTC', '/market/price_usd_close', '2024-01-01', '2024-01-30');

    expect(result).toEqual([
      ['Date', 'price.usd.close'],
      ['2024-01-01', 42167.84],
      ['2024-01-02', 44172.56],
      ['2024-01-30', 43156.78],
    ]);

    // Verify the API was called with correct timestamps
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC',
        i: '24h',
        s: '1704067200',
        u: '1706572800'
      })
    );
  });

  it('should return error for invalid date string format', async () => {
    const result = await METRIC('BTC', '/market/price_usd_close', 'invalid-date-format');

    expect(result).toEqual([['Error: Invalid date format. Expected YYYY-MM-DD or Excel serial number.']]);
    expect(mock.history.get).toHaveLength(0);
  });

  it('should work without any optional parameters', async () => {
    const mockResponse = [{ t: 1704067200, v: 45123.45 }];

    mock.onGet('/api/glassnode/v1/metrics/market/price_usd_close').reply(200, mockResponse);

    const result = await METRIC('BTC', '/market/price_usd_close', '2024-01-01', null);

    expect(result).toEqual([[45123.45]]);

    // Verify the API was called without any optional parameters
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC',
        i: '24h',
        s: '1704067200'
      })
    );
  });

  it('should handle null endDate correctly (which is what excel will provide for unset parameters)', async () => {
    const mockResponse = [{ t: 1704067200, v: 43123.45 }];

    mock.onGet('/api/glassnode/v1/metrics/market/price_usd_close').reply(200, mockResponse);

    const result = await METRIC('BTC', '/market/price_usd_close', '2024-01-01', null);
    expect(result).toEqual([[43123.45]]);

    // Verify the API was called without the 'u' (until/endDate) parameter
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC',
        i: '24h',
        s: '1704067200'
      })
    );
    // Verify 'u' parameter is not present
    expect(mock.history.get[0].params).not.toHaveProperty('u');
  });

  it('should handle all 4 optional parameters correctly', async () => {
    const mockResponse = [{ t: 1704067200, v: 100.5 }];

    mock.onGet('/api/glassnode/v1/metrics/addresses/active_count').reply(200, mockResponse);

    const startDate = '45292'; // 2024-01-01

    await METRIC('BTC', '/addresses/active_count', startDate, undefined, 'e=binance', 'c=usd', 'network=base', 'miner=FoundryUSAPool');

    // Verify the API was called with all 4 optional parameters in correct order
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC',
        i: '24h',
        s: '1704067200',
        e: 'binance',
        c: 'usd',
        network: 'base',
        miner: 'FoundryUSAPool'
      })
    );
  });

  it('should handle mixed optional parameters (some not defined)', async () => {
    const mockResponse = [{ t: 1704067200, v: 100.5 }];

    mock.onGet('/api/glassnode/v1/metrics/addresses/active_count').reply(200, mockResponse);

    const startDate = '45292'; // 2024-01-01

    // Test with parameter1 and parameter3 defined, parameter2 and parameter4 undefined
    await METRIC('BTC', '/addresses/active_count', startDate, null, 'e=binance', null, 'network=base', null);

    // Verify the API was called with only the defined optional parameters
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC',
        i: '24h',
        s: '1704067200',
        e: 'binance',
        network: 'base'
      })
    );
  });

  it('should ignore invalid parameter format (missing equals sign)', async () => {
    const mockResponse = [{ t: 1704067200, v: 100.5 }];

    mock.onGet('/api/glassnode/v1/metrics/addresses/active_count').reply(200, mockResponse);

    const startDate = '45292'; // 2024-01-01

    // Test with one valid parameter and one invalid parameter format
    await METRIC('BTC', '/addresses/active_count', startDate, null, 'e=binance', 'invalidformat', 'network=base');

    // Verify the API was called with only valid parameters (invalidformat should be ignored)
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC',
        i: '24h',
        s: '1704067200',
        e: 'binance',
        network: 'base'
      })
    );
  });

  it('should handle empty string parameters', async () => {
    const mockResponse = [{ t: 1704067200, v: 100.5 }];

    mock.onGet('/api/glassnode/v1/metrics/addresses/active_count').reply(200, mockResponse);

    const startDate = '45292'; // 2024-01-01

    // Test with empty strings and valid parameters
    await METRIC('BTC', '/addresses/active_count', startDate, null, '', 'c=usd', '', 'miner=FoundryUSAPool');

    // Verify the API was called with only non-empty parameters
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual(
      expect.objectContaining({
        api_key: 'test-api-key',
        a: 'BTC',
        i: '24h',
        s: '1704067200',
        c: 'usd',
        miner: 'FoundryUSAPool'
      })
    );
  });

  describe('Status code handling', () => {
    it('should return specific error message for 404 responses', async () => {
      mock.onGet('/api/glassnode/v1/metrics/addresses/active_count').reply(404);

      const result = await METRIC('BTC', '/addresses/active_count', '44562');

      expect(result).toEqual([['Error: 404 metric not found - correct metric endpoint selected?']]);
      expect(mock.history.get).toHaveLength(1);
    });

    it('should return specific error message for 429 responses', async () => {
      mock.onGet('/api/glassnode/v1/metrics/addresses/active_count').reply(429);

      const result = await METRIC('BTC', '/addresses/active_count', '44562');

      expect(result).toEqual([['Error: 429 rate limit exceeded - too many requests to the Glassnode API']]);
      expect(mock.history.get).toHaveLength(1);
    });
  });
});
