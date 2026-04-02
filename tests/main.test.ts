import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import AsciiBorders from '../src/main';
import { DEFAULT_SETTINGS } from '../src/settings';

// Mock Obsidian
const mockApp = {
  workspace: {
    trigger: jest.fn()
  }
} as any;

const mockPlugin = {
  app: mockApp,
  registerMarkdownCodeBlockProcessor: jest.fn(),
  addSettingTab: jest.fn(),
  loadData: jest.fn(),
  saveData: jest.fn()
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
      plugin.loadData = jest.fn().mockResolvedValue({});
      await plugin.onload();
      expect(plugin.loadData).toHaveBeenCalled();
    });

    test('registers code block processor for each border', async () => {
      plugin.loadData = jest.fn().mockResolvedValue({});
      await plugin.onload();

      const borderNames = Object.keys(DEFAULT_SETTINGS.borders);
      expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalledTimes(borderNames.length);

      borderNames.forEach((name) => {
        expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalledWith(
          `border-${name}`,
          expect.any(Function)
        );
      });
    });

    test('adds settings tab', async () => {
      plugin.loadData = jest.fn().mockResolvedValue({});
      await plugin.onload();
      expect(plugin.addSettingTab).toHaveBeenCalledTimes(1);
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
              bottomRight: '+'
            },
            centerText: true
          }
        }
      };

      plugin.loadData = jest.fn().mockResolvedValue(savedData);
      await plugin.loadSettings();

      expect(plugin.settings).toEqual(savedData);
    });

    test('uses defaults when no saved data', async () => {
      plugin.loadData = jest.fn().mockResolvedValue(null);
      await plugin.loadSettings();

      expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
    });

    test('uses defaults when loadData returns undefined', async () => {
      plugin.loadData = jest.fn().mockResolvedValue(undefined);
      await plugin.loadSettings();

      expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings', () => {
    test('saves settings data', async () => {
      plugin.settings = DEFAULT_SETTINGS;
      plugin.saveData = jest.fn().mockResolvedValue(undefined);

      await plugin.saveSettings();

      expect(plugin.saveData).toHaveBeenCalledWith(DEFAULT_SETTINGS);
    });

    test('triggers markdown preview refresh', async () => {
      plugin.settings = DEFAULT_SETTINGS;
      plugin.saveData = jest.fn().mockResolvedValue(undefined);

      await plugin.saveSettings();

      expect(mockApp.workspace.trigger).toHaveBeenCalledWith('markdown-preview-refresh');
    });
  });

  describe('onunload', () => {
    test('exists and is callable', () => {
      expect(() => plugin.onunload()).not.toThrow();
    });
  });
});
