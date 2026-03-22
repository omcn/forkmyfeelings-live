import "@testing-library/jest-dom";

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, value) => { store[key] = String(value); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((i) => Object.keys(store)[i] ?? null),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock navigator.vibrate
Object.defineProperty(navigator, "vibrate", { value: jest.fn(), writable: true });

// Mock navigator.share
Object.defineProperty(navigator, "share", { value: jest.fn(), writable: true });

// Mock IntersectionObserver
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
