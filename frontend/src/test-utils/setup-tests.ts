// Global test setup - runs before all tests
import '@testing-library/jest-dom'

// Mock browser APIs that aren't available in Jest/jsdom
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock timers
global.setInterval = jest.fn();
global.clearInterval = jest.fn();
global.setTimeout = jest.fn();
global.clearTimeout = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
Object.defineProperty(global, 'sessionStorage', {
  value: localStorageMock,
  writable: true
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as jest.Mock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Mock store subscriptions to prevent them from running in tests
jest.mock('../lib/store/utils/subscriptions', () => ({
  setupStoreSubscriptions: jest.fn(() => jest.fn()), // Return cleanup function
  cleanupSubscriptions: jest.fn(),
}));

// Suppress console errors in tests unless they're assertion failures
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    // Allow assertion errors to pass through
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('expect') || args[0].includes('TestingLibraryElementError'))
    ) {
      originalError(...args);
      return;
    }
    // Suppress other console.error calls in tests
  };
});

afterEach(() => {
  console.error = originalError;
  jest.clearAllMocks();
});