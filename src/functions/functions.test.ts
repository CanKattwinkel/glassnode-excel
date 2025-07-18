import { ASSETS, METRIC } from './functions';

// Mock the fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('ASSETS function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-api-key');
  });

  it('should return asset IDs when API call is successful', async () => {
    const mockResponse = {
      data: [
        { id: 'BTC' },
        { id: 'ETH' },
        { id: 'ADA' },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await ASSETS(2);

    expect(result).toEqual([['BTC'], ['ETH']]);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/glassnode/v1/metadata/assets?api_key=test-api-key'
    );
  });

  it('should return error when API key is not configured', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const result = await ASSETS();

    expect(result).toEqual([['Error: API key not configured. Please set your API key in the task pane.']]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return error when API call fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const result = await ASSETS();

    expect(result).toEqual([['Error: HTTP error! status: 401']]);
  });

  it('should apply limit parameter correctly', async () => {
    const mockResponse = {
      data: [
        { id: 'BTC' },
        { id: 'ETH' },
        { id: 'ADA' },
        { id: 'DOT' },
        { id: 'LINK' },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await ASSETS(3);

    expect(result).toEqual([['BTC'], ['ETH'], ['ADA']]);
    expect(result).toHaveLength(3);
  });

  it('should filter out undefined/null IDs', async () => {
    const mockResponse = {
      data: [
        { id: 'BTC' },
        { id: null },
        { id: 'ETH' },
        { id: undefined },
        { id: 'ADA' },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await ASSETS();

    expect(result).toEqual([['BTC'], ['ETH'], ['ADA']]);
    expect(result).toHaveLength(3);
  });
});

describe('METRIC function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-api-key');
  });

  it('should return single value for single data point', async () => {
    const mockResponse = [
      { t: 1640995200, v: 100.5 }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Excel date serial number for 2022-01-01
    const excelDate = '44562';
    const result = await METRIC('BTC', '/addresses/active_count', excelDate);

    expect(result).toEqual([['100.5']]);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/glassnode/v1/metrics/addresses/active_count')
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('a=BTC')
    );
  });

  it('should return table format for date range', async () => {
    const mockResponse = [
      { t: 1640995200, v: 100.5 },
      { t: 1641081600, v: 102.3 },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Excel date serial numbers for 2022-01-01 and 2022-01-02
    const startDate = '44562';
    const endDate = '44563';
    const result = await METRIC('BTC', '/addresses/active_count', startDate, endDate);

    expect(result).toEqual([
      ['Date', 'active.count'],
      ['2022-01-01', '100.5'],
      ['2022-01-02', '102.3'],
    ]);
  });

  it('should return error when API key is not configured', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const result = await METRIC('BTC', '/addresses/active_count', '44562');

    expect(result).toEqual([['Error: API key not configured. Please set your API key in the task pane.']]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return error when required parameters are missing', async () => {
    const result = await METRIC('', '/addresses/active_count', '44562');

    expect(result).toEqual([['Error: asset, metric, and startDate are required parameters']]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return error when date format is invalid', async () => {
    const result = await METRIC('BTC', '/addresses/active_count', 'invalid-date');

    expect(result).toEqual([['Error: Invalid start date format. Expected Excel date serial number.']]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return error when metric path does not start with /', async () => {
    const result = await METRIC('BTC', 'addresses/active_count', '44562');

    expect(result).toEqual([['Error: Invalid path, make sure to use API endpoint notation like /addresses/active_count']]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return specific error message for 404 responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const result = await METRIC('BTC', '/addresses/active_count', '44562');

    expect(result).toEqual([['Error: 404 metric not found - correct metric endpoint selected?']]);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/glassnode/v1/metrics/addresses/active_count')
    );
  });

  it('should construct correct API URL with parameters', async () => {
    const mockResponse = [{ t: 1640995200, v: 100.5 }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const startDate = '44562'; // 2022-01-01
    const endDate = '44563';   // 2022-01-02
    
    await METRIC('BTC', '/addresses/active_count', startDate, endDate);

    const expectedUrl = '/api/glassnode/v1/metrics/addresses/active_count?api_key=test-api-key&a=BTC&i=24h&s=1640995200&u=1641081600';
    expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
  });
});
