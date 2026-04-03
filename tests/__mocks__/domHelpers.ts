import { jest } from '@jest/globals';

export function createMockPreview() {
  return {
    textContent: '',
    getBoundingClientRect: jest.fn(() => ({ width: 100 })),
    createEl: jest.fn((tag: string) => ({
      textContent: '',
      getBoundingClientRect: jest.fn(() => ({ width: 50 })),
    })),
    appendChild: jest.fn(),
  };
}

export function createMockContainer(mockPreview?: any) {
  const preview = mockPreview || createMockPreview();

  return {
    empty: jest.fn(),
    createDiv: jest.fn().mockReturnValue({
      innerHTML: '',
      createDiv: jest.fn(),
      createEl: jest.fn((tag: string) => {
        if (tag === 'pre') return preview;
        return {
          textContent: '',
          getBoundingClientRect: jest.fn(() => ({ width: 50 })),
        };
      }),
      querySelector: jest.fn((selector: string) => {
        if (selector === '.border-preview') return preview;
        return null;
      }),
    }),
    createEl: jest.fn((tag: string) => {
      if (tag === 'pre') return preview;
      return {
        textContent: '',
        getBoundingClientRect: jest.fn(() => ({ width: 50 })),
      };
    }),
    querySelector: jest.fn(),
  };
}

export function createMockApp() {
  return {
    workspace: {
      trigger: jest.fn(),
    },
  };
}

export function createMockPlugin(settings: any) {
  return {
    settings: JSON.parse(JSON.stringify(settings)),
    saveSettings: jest.fn(() => Promise.resolve()) as any,
  };
}
