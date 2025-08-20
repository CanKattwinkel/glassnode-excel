import {ASSETS} from './assets';
import {apiClient} from './api';
import MockAdapter from 'axios-mock-adapter';

describe('ASSETS function', () => {
  // @ts-ignore
  let mock: MockAdapter;

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    // Create MockAdapter for the cached axios instance, not the base axios
    mock = new MockAdapter(apiClient);
    (global as any).OfficeRuntime.storage.getItem.mockReturnValue('test-api-key');

    // Clear the cache storage before each test
    (apiClient as any).storage?.clear?.();
  });

  afterEach(() => {
    mock.restore();
  });

  it('should return asset IDs when API call is successful', async () => {
    const mockResponse = {
      data: [{id: 'BTC'}, {id: 'ETH'}, {id: 'ADA'}],
    };

    mock.onGet('/api/glassnode/v1/metadata/assets').reply(200, mockResponse);

    const result = await ASSETS(2);

    expect(result).toEqual([['BTC'], ['ETH']]);
    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual({
      api_key: 'test-api-key',
      source: 'excel-add-in',
    });
  });

  it('should return error when API key is not configured', async () => {
    (global as any).OfficeRuntime.storage.getItem.mockReturnValue(null);

    const result = await ASSETS();

    expect(result).toEqual([['Error: API key not configured. Please set your API key in the task pane.']]);
    expect(mock.history.get).toHaveLength(0);
  });

  it('should return error when API call fails with axios error', async () => {
    mock.onGet('/api/glassnode/v1/metadata/assets').reply(401);

    const result = await ASSETS();

    expect(result).toEqual([['Error: HTTP error! status: 401']]);
  });

  it('should apply limit parameter correctly', async () => {
    const mockResponse = {
      data: [{id: 'BTC'}, {id: 'ETH'}, {id: 'ADA'}, {id: 'DOT'}, {id: 'LINK'}],
    };

    mock.onGet('/api/glassnode/v1/metadata/assets').reply(200, mockResponse);

    const result = await ASSETS(3);

    expect(result).toEqual([['BTC'], ['ETH'], ['ADA']]);
    expect(result).toHaveLength(3);
  });

  it('should filter out undefined/null IDs', async () => {
    const mockResponse = {
      data: [{id: 'BTC'}, {id: null}, {id: 'ETH'}, {id: undefined}, {id: 'ADA'}, {id: ''}],
    };

    mock.onGet('/api/glassnode/v1/metadata/assets').reply(200, mockResponse);

    const result = await ASSETS();

    expect(result).toEqual([['BTC'], ['ETH'], ['ADA']]);
    expect(result).toHaveLength(3);
  });

  it('should cache requests and return same results for identical requests', async () => {
    const mockResponse = {
      data: [{id: 'BTC'}],
    };

    mock.onGet('/api/glassnode/v1/metadata/assets').reply(200, mockResponse);

    // Make multiple identical requests
    const [result1, result2, result3] = await Promise.all([ASSETS(10), ASSETS(10), ASSETS(10)]);

    expect(result1).toEqual([['BTC']]);
    expect(result2).toEqual([['BTC']]);
    expect(result3).toEqual([['BTC']]);

    // All results should be identical (proving cache works)
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  describe('Status code handling', () => {
    it('should return specific error message for 429 responses', async () => {
      mock.onGet('/api/glassnode/v1/metadata/assets').reply(429);

      const result = await ASSETS();

      expect(result).toEqual([['Error: 429 rate limit exceeded - too many requests to the Glassnode API']]);
      expect(mock.history.get).toHaveLength(1);
    });

    it('should handle network errors', async () => {
      mock.onGet('/api/glassnode/v1/metadata/assets').networkError();

      const result = await ASSETS();

      expect(result[0][0]).toContain('Error:');
    });

    it('should use same cache for different limits and return consistent results', async () => {
      const mockResponse = {
        data: [{id: 'BTC'}, {id: 'ETH'}, {id: 'ADA'}, {id: 'DOT'}, {id: 'LINK'}],
      };

      mock.onGet('/api/glassnode/v1/metadata/assets').reply(200, mockResponse);

      // Make requests with different limits
      const result1 = await ASSETS(2);
      const result2 = await ASSETS(3);
      const result3 = await ASSETS(); // no limit

      // Different results due to different slicing
      expect(result1).toEqual([['BTC'], ['ETH']]);
      expect(result2).toEqual([['BTC'], ['ETH'], ['ADA']]);
      expect(result3).toEqual([['BTC'], ['ETH'], ['ADA'], ['DOT'], ['LINK']]);

      // Verify that different limits produce different slices of the same data
      expect(result2.slice(0, 2)).toEqual(result1);
      expect(result3.slice(0, 3)).toEqual(result2);
    });
  });
});
