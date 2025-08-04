import { ASSETS } from './assets';

// Mock the fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ASSETS function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).OfficeRuntime.storage.getItem.mockReturnValue('test-api-key');
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
    (global as any).OfficeRuntime.storage.getItem.mockReturnValue(null);

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
        { id: '' },
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

  describe('Status code handling', () => {
        it('should return specific error message for 429 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const result = await ASSETS();

      expect(result).toEqual([['Error: 429 rate limit exceeded - too many requests to the Glassnode API']]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/glassnode/v1/metadata/assets')
      );
    });
  });
});
