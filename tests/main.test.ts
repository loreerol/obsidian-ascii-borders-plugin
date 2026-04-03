import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import AsciiBorders from '../src/main';
import { DEFAULT_BORDERS } from '../src/utils/defaults';

jest.mock('../src/renderer', () => ({
  renderBorder: jest.fn(),
}));

// Mock Obsidian
const mockApp = {
  workspace: {
    trigger: jest.fn(),
  },
} as any;

const mockPlugin = {
  app: mockApp,
  registerMarkdownCodeBlockProcessor: jest.fn(),
  addSettingTab: jest.fn(),
  loadData: jest.fn(),
  saveData: jest.fn(),
} as any;

describe('AsciiBorders Plugin', () => {
  let plugin: AsciiBorders;

  beforeEach(() => {
    jest.clearAllMocks();
    plugin = new AsciiBorders(mockApp, {} as any);
    Object.assign(plugin, mockPlugin);
  });

  describe('onload', () => {
    test('loads settings', async () => {
      plugin.loadData = jest.fn(() => Promise.resolve({})) as any;
      await plugin.onload();
      expect(plugin.loadData).toHaveBeenCalled();
    });

    test('registers code block processor for each border', async () => {
      plugin.loadData = jest.fn(() => Promise.resolve({})) as any;
      await plugin.onload();

      const borderNames = Object.keys(DEFAULT_BORDERS.borders);
      expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalledTimes(borderNames.length);

      borderNames.forEach((name) => {
        expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalledWith(
          `border-${name}`,
          expect.any(Function)
        );
      });
    });

    test('adds settings tab', async () => {
      plugin.loadData = jest.fn(() => Promise.resolve({})) as any;
      await plugin.onload();
      expect(plugin.addSettingTab).toHaveBeenCalledTimes(1);
    });

    test('registers callback that calls renderBorder', async () => {
      const { renderBorder } = require('../src/renderer');
      plugin.loadData = jest.fn(() => Promise.resolve({})) as any;
      await plugin.onload();

      const calls = (plugin.registerMarkdownCodeBlockProcessor as jest.Mock).mock.calls;
      const firstCall = calls[0];
      const callback = firstCall[1] as (source: string, el: HTMLElement, ctx: any) => void;

      const mockEl = document.createElement('div');
      const mockCtx = {};
      callback('test content', mockEl, mockCtx);

      expect(renderBorder).toHaveBeenCalledWith(
        'test content',
        mockEl,
        expect.any(Object),
        mockApp,
        mockCtx
      );
    });
  });

  describe('loadSettings', () => {
    test('merges saved data with defaults', async () => {
      const savedData = {
        borders: {
          custom: {
            style: {
              top: '~',
              bottom: '~',
              left: '|',
              right: '|',
              topLeft: '+',
              topRight: '+',
              bottomLeft: '+',
              bottomRight: '+',
            },
            centerText: true,
          },
        },
      };

      plugin.loadData = jest.fn(() => Promise.resolve(savedData)) as any;
      await plugin.loadSettings();

      expect(plugin.settings).toEqual(savedData);
    });

    test('uses defaults when no saved data', async () => {
      plugin.loadData = jest.fn(() => Promise.resolve(null)) as any;
      await plugin.loadSettings();

      expect(plugin.settings).toEqual(DEFAULT_BORDERS);
    });

    test('uses defaults when loadData returns undefined', async () => {
      plugin.loadData = jest.fn(() => Promise.resolve(undefined)) as any;
      await plugin.loadSettings();

      expect(plugin.settings).toEqual(DEFAULT_BORDERS);
    });

    test('uses defaults when loadData throws error', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      plugin.loadData = jest.fn(() => Promise.reject(new Error('Corrupted data'))) as any;

      await plugin.loadSettings();

      expect(plugin.settings).toEqual(DEFAULT_BORDERS);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load settings, using defaults:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('saveSettings', () => {
    beforeEach(() => {
      plugin.settings = JSON.parse(JSON.stringify(DEFAULT_BORDERS));
    });

    test('saves settings data', async () => {
      plugin.saveData = jest.fn(() => Promise.resolve()) as any;

      await plugin.saveSettings();

      expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
    });

    test('registers new border processors', async () => {
      plugin.loadData = jest.fn(() => Promise.resolve({})) as any;
      await plugin.onload();

      const initialCallCount = (plugin.registerMarkdownCodeBlockProcessor as jest.Mock).mock.calls
        .length;

      // Add a new border
      plugin.settings.borders['newborder'] = {
        style: {
          top: '─',
          bottom: '─',
          left: '│',
          right: '│',
          topLeft: '┌',
          topRight: '┐',
          bottomLeft: '└',
          bottomRight: '┘',
        },
        centerText: false,
      };

      await plugin.saveSettings();

      expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalledTimes(initialCallCount + 1);
      expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalledWith(
        'border-newborder',
        expect.any(Function)
      );
    });

    test('does not re-register existing borders', async () => {
      plugin.loadData = jest.fn(() => Promise.resolve({})) as any;
      await plugin.onload();

      const callCountAfterLoad = (plugin.registerMarkdownCodeBlockProcessor as jest.Mock).mock.calls
        .length;

      // Save without adding new borders
      await plugin.saveSettings();

      // Should not register again
      expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalledTimes(callCountAfterLoad);
    });

    test('triggers markdown preview refresh', async () => {
      plugin.saveData = jest.fn(() => Promise.resolve()) as any;

      await plugin.saveSettings();

      expect(mockApp.workspace.trigger).toHaveBeenCalledWith('markdown-preview-refresh');
    });

    test('logs error and rethrows when saveData fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Save failed');
      plugin.saveData = jest.fn(() => Promise.reject(error)) as any;

      await expect(plugin.saveSettings()).rejects.toThrow('Save failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save settings:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('registerBorderProcessors', () => {
    test('tracks registered borders', async () => {
      plugin.loadData = jest.fn(() => Promise.resolve({})) as any;
      await plugin.onload();

      const registeredBorders = (plugin as any).registeredBorders;
      const borderNames = Object.keys(DEFAULT_BORDERS.borders);

      borderNames.forEach((name) => {
        expect(registeredBorders.has(name)).toBe(true);
      });
    });

    test('only registers each border once', async () => {
      plugin.loadData = jest.fn(() => Promise.resolve({})) as any;
      await plugin.onload();

      const initialCount = (plugin.registerMarkdownCodeBlockProcessor as jest.Mock).mock.calls
        .length;

      // Call registerBorderProcessors again
      (plugin as any).registerBorderProcessors();

      // Should not register again
      expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalledTimes(initialCount);
    });
  });

  describe('onunload', () => {
    test('exists and is callable', () => {
      expect(() => plugin.onunload()).not.toThrow();
    });
  });
});
