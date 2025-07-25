// Jest setup file for global configurations
// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock OfficeRuntime for testing
const officeRuntimeMock = {
  storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
};

// Mock global fetch
global.fetch = jest.fn();

// Setup localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Setup OfficeRuntime mock
Object.defineProperty(global, 'OfficeRuntime', {
  value: officeRuntimeMock,
});

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
