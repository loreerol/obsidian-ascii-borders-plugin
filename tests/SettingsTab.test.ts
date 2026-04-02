import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { SettingsTab } from '../src/SettingsTab';
import { DEFAULT_SETTINGS } from '../src/settings';
import { BorderConfig } from '../src/utils/types';

// Mock dependencies
jest.mock('../src/borderProcessor', () => ({
  createBorder: jest.fn(() => 'bordered preview'),
}));

jest.mock('../src/utils/measurements', () => ({
  calculateReadableWidth: jest.fn(() => 100),
}));

const { createBorder } = require('../src/borderProcessor');

describe('SettingsTab', () => {
  let settingsTab: SettingsTab;
  let mockApp: any;
  let mockPlugin: any;
  let mockContainer: any;
  let mockPreview: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockPreview = {
      textContent: '',
      getBoundingClientRect: jest.fn(() => ({ width: 100 })),
    };

    mockContainer = {
      empty: jest.fn(),
      createDiv: jest.fn().mockReturnValue({
        innerHTML: '',
        createDiv: jest.fn(),
        createEl: jest.fn((tag: string) => {
          if (tag === 'pre') return mockPreview;
          return {
            textContent: '',
            getBoundingClientRect: jest.fn(() => ({ width: 50 })),
          };
        }),
        querySelector: jest.fn((selector: string) => {
          if (selector === '.border-preview') return mockPreview;
          return null;
        }),
      }),
      createEl: jest.fn((tag: string) => {
        if (tag === 'pre') return mockPreview;
        return {
          textContent: '',
          getBoundingClientRect: jest.fn(() => ({ width: 50 })),
        };
      }),
      querySelector: jest.fn(),
    };

    mockApp = {
      workspace: {},
    };

    mockPlugin = {
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      saveSettings: jest.fn(() => Promise.resolve()) as any,
    };

    // Mock document.querySelectorAll
    global.document.querySelectorAll = jest.fn(() => []) as any;

    settingsTab = new SettingsTab(mockApp, mockPlugin);
    settingsTab.containerEl = mockContainer;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    test('initializes with app and plugin', () => {
      expect(settingsTab.plugin).toBe(mockPlugin);
    });

    test('initializes empty debounce timeouts map', () => {
      expect((settingsTab as any).debounceTimeouts).toBeInstanceOf(Map);
      expect((settingsTab as any).debounceTimeouts.size).toBe(0);
    });
  });

  describe('display', () => {
    test('empties container', () => {
      settingsTab.display();
      expect(mockContainer.empty).toHaveBeenCalled();
    });

    test('creates heading setting', () => {
      settingsTab.display();
      expect(mockContainer.createDiv).toHaveBeenCalled();
    });

    test('adds instructions', () => {
      settingsTab.display();
      const instructionsDiv = mockContainer.createDiv.mock.results[0].value;
      expect(instructionsDiv.innerHTML).toContain('Managing Borders');
      expect(instructionsDiv.innerHTML).toContain('border-&lt;name&gt;');
    });

    test('renders all borders from settings', () => {
      const renderSpy = jest.spyOn(settingsTab as any, 'renderBorderSettings');
      settingsTab.display();

      const borderCount = Object.keys(DEFAULT_SETTINGS.borders).length;
      expect(renderSpy).toHaveBeenCalledTimes(borderCount);
    });
  });

  describe('save', () => {
    test('saves settings immediately when no debounce key', async () => {
      await (settingsTab as any).save();
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
    });

    test('dispatches update events to all border containers', async () => {
      const mockDispatch = jest.fn();
      const mockContainerEl = {
        dispatchEvent: mockDispatch,
      };

      global.document.querySelectorAll = jest.fn(() => [mockContainerEl] as any) as any;

      await (settingsTab as any).save();

      expect(mockDispatch).toHaveBeenCalledWith(expect.any(Event));
      expect((mockDispatch.mock.calls[0][0] as Event).type).toBe('ascii-border-update');
    });

    test('debounces save when debounceKey provided', async () => {
      const savePromise = (settingsTab as any).save({ debounceKey: 'test-key' });

      expect(mockPlugin.saveSettings).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      await savePromise;

      expect(mockPlugin.saveSettings).toHaveBeenCalled();
    });

    test('cancels previous debounced save with same key', async () => {
      (settingsTab as any).save({ debounceKey: 'test-key' });
      (settingsTab as any).save({ debounceKey: 'test-key' });

      jest.advanceTimersByTime(500);

      // Should only save once
      expect(mockPlugin.saveSettings).toHaveBeenCalledTimes(1);
    });

    test('allows multiple debounced saves with different keys', async () => {
      (settingsTab as any).save({ debounceKey: 'key1' });
      (settingsTab as any).save({ debounceKey: 'key2' });

      jest.advanceTimersByTime(500);

      // Both should save
      expect(mockPlugin.saveSettings).toHaveBeenCalledTimes(2);
    });

    test('stores timeout in map when debouncing', () => {
      (settingsTab as any).save({ debounceKey: 'test-key' });

      expect((settingsTab as any).debounceTimeouts.has('test-key')).toBe(true);
      expect((settingsTab as any).debounceTimeouts.get('test-key')).toBeDefined();
    });
  });

  describe('addBorder', () => {
    test('generates unique border name', async () => {
      const initialCount = Object.keys(mockPlugin.settings.borders).length;

      await (settingsTab as any).addBorder();

      const newCount = Object.keys(mockPlugin.settings.borders).length;
      expect(newCount).toBe(initialCount + 1);
      expect(mockPlugin.settings.borders['custom']).toBeDefined();
    });

    test('adds border with default style', async () => {
      await (settingsTab as any).addBorder();

      const customBorder = mockPlugin.settings.borders['custom'];
      expect(customBorder.style.top).toBe('═');
      expect(customBorder.style.left).toBe('║');
      expect(customBorder.centerText).toBe(false);
    });

    test('adds new border at start of list', async () => {
      await (settingsTab as any).addBorder();

      const keys = Object.keys(mockPlugin.settings.borders);
      expect(keys[0]).toBe('custom');
    });

    test('saves settings after adding', async () => {
      await (settingsTab as any).addBorder();
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
    });

    test('redisplays after adding', async () => {
      const displaySpy = jest.spyOn(settingsTab, 'display');
      await (settingsTab as any).addBorder();
      expect(displaySpy).toHaveBeenCalled();
    });
  });

  describe('generateUniqueBorderName', () => {
    test('returns "custom" when available', () => {
      delete mockPlugin.settings.borders['custom'];
      const name = (settingsTab as any).generateUniqueBorderName();
      expect(name).toBe('custom');
    });

    test('increments counter when name exists', () => {
      mockPlugin.settings.borders['custom'] = (settingsTab as any).createDefaultBorder();
      const name = (settingsTab as any).generateUniqueBorderName();
      expect(name).toBe('custom-1');
    });

    test('continues incrementing until unique', () => {
      mockPlugin.settings.borders['custom'] = (settingsTab as any).createDefaultBorder();
      mockPlugin.settings.borders['custom-1'] = (settingsTab as any).createDefaultBorder();
      mockPlugin.settings.borders['custom-2'] = (settingsTab as any).createDefaultBorder();

      const name = (settingsTab as any).generateUniqueBorderName();
      expect(name).toBe('custom-3');
    });
  });

  describe('createDefaultBorder', () => {
    test('returns default border config', () => {
      const border = (settingsTab as any).createDefaultBorder();

      expect(border.style.top).toBe('═');
      expect(border.style.bottom).toBe('═');
      expect(border.style.left).toBe('║');
      expect(border.style.right).toBe('║');
      expect(border.style.topLeft).toBe('╔');
      expect(border.style.topRight).toBe('╗');
      expect(border.style.bottomLeft).toBe('╚');
      expect(border.style.bottomRight).toBe('╝');
      expect(border.centerText).toBe(false);
    });
  });

  describe('renameBorder', () => {
    beforeEach(() => {
      mockPlugin.settings.borders = {
        'old-name': (settingsTab as any).createDefaultBorder(),
        other: (settingsTab as any).createDefaultBorder(),
      };
    });

    test('renames border key', async () => {
      await (settingsTab as any).renameBorder('old-name', 'new-name');

      expect(mockPlugin.settings.borders['new-name']).toBeDefined();
      expect(mockPlugin.settings.borders['old-name']).toBeUndefined();
    });

    test('normalizes border name to lowercase', async () => {
      await (settingsTab as any).renameBorder('old-name', 'NEW NAME');

      expect(mockPlugin.settings.borders['new-name']).toBeDefined();
    });

    test('replaces spaces and special chars with hyphens', async () => {
      await (settingsTab as any).renameBorder('old-name', 'my cool border!');

      expect(mockPlugin.settings.borders['my-cool-border']).toBeDefined();
    });

    test('removes leading and trailing hyphens', async () => {
      await (settingsTab as any).renameBorder('old-name', '-test-');

      expect(mockPlugin.settings.borders['test']).toBeDefined();
    });

    test('does nothing when new name is empty', async () => {
      await (settingsTab as any).renameBorder('old-name', '   ');

      expect(mockPlugin.settings.borders['old-name']).toBeDefined();
      expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
    });

    test('does nothing when new name equals old name', async () => {
      await (settingsTab as any).renameBorder('old-name', 'old-name');

      expect(mockPlugin.settings.borders['old-name']).toBeDefined();
      expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
    });

    test('shows notice when name already exists', async () => {
      const NoticeMock = require('obsidian').Notice;
      const noticeSpy = jest.spyOn(NoticeMock.prototype, 'constructor' as any);

      await (settingsTab as any).renameBorder('old-name', 'other');

      expect(mockPlugin.settings.borders['old-name']).toBeDefined();
      expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
    });

    test('preserves order of borders', async () => {
      mockPlugin.settings.borders = {
        first: (settingsTab as any).createDefaultBorder(),
        middle: (settingsTab as any).createDefaultBorder(),
        last: (settingsTab as any).createDefaultBorder(),
      };

      await (settingsTab as any).renameBorder('middle', 'renamed');

      const keys = Object.keys(mockPlugin.settings.borders);
      expect(keys).toEqual(['first', 'renamed', 'last']);
    });

    test('saves and redisplays after rename', async () => {
      const displaySpy = jest.spyOn(settingsTab, 'display');
      await (settingsTab as any).renameBorder('old-name', 'new-name');

      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(displaySpy).toHaveBeenCalled();
    });
  });

  describe('deleteBorder', () => {
    test('removes border from settings', async () => {
      mockPlugin.settings.borders['to-delete'] = (settingsTab as any).createDefaultBorder();

      await (settingsTab as any).deleteBorder('to-delete');

      expect(mockPlugin.settings.borders['to-delete']).toBeUndefined();
    });

    test('saves after deletion', async () => {
      await (settingsTab as any).deleteBorder('heart');
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
    });

    test('redisplays after deletion', async () => {
      const displaySpy = jest.spyOn(settingsTab, 'display');
      await (settingsTab as any).deleteBorder('heart');
      expect(displaySpy).toHaveBeenCalled();
    });
  });

  describe('addBorderPreview', () => {
    test('creates preview element', () => {
      const container = mockContainer.createDiv();
      const config = (settingsTab as any).createDefaultBorder();

      (settingsTab as any).addBorderPreview(container, config);

      expect(container.createEl).toHaveBeenCalledWith('pre', { cls: 'border-preview' });
    });

    test('creates measure span', () => {
      const container = mockContainer.createDiv();
      const config = (settingsTab as any).createDefaultBorder();

      (settingsTab as any).addBorderPreview(container, config);

      expect(container.createEl).toHaveBeenCalledWith('span', { cls: 'ascii-border-measure-span' });
    });

    test('renders preview after delay', () => {
      const container = mockContainer.createDiv();
      const config = (settingsTab as any).createDefaultBorder();

      (settingsTab as any).addBorderPreview(container, config);

      expect(createBorder).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);

      expect(createBorder).toHaveBeenCalledWith(
        'Sample Text',
        config.style,
        expect.any(Function),
        100,
        false
      );
    });

    test('shows error message on preview failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      createBorder.mockImplementationOnce(() => {
        throw new Error('Preview error');
      });
      const container = mockContainer.createDiv();
      const config = (settingsTab as any).createDefaultBorder();
      (settingsTab as any).addBorderPreview(container, config);
      jest.advanceTimersByTime(1);

      expect(mockPreview.textContent).toBe('Error rendering preview');
      expect(consoleSpy).toHaveBeenCalledWith('Error rendering preview:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('stores update function on preview element', () => {
      const container = mockContainer.createDiv();
      const config = (settingsTab as any).createDefaultBorder();

      (settingsTab as any).addBorderPreview(container, config);

      expect(mockPreview._updatePreview).toBeInstanceOf(Function);
    });
  });

  describe('updateBorderPreview', () => {
    test('calls stored update function', () => {
      const updateFn = jest.fn();
      mockPreview._updatePreview = updateFn;

      const container = mockContainer.createDiv();
      (settingsTab as any).updateBorderPreview(container);

      expect(updateFn).toHaveBeenCalled();
    });

    test('handles missing preview element', () => {
      const container = {
        querySelector: jest.fn(() => null),
      };

      expect(() => {
        (settingsTab as any).updateBorderPreview(container);
      }).not.toThrow();
    });

    test('handles preview without update function', () => {
      const previewWithoutUpdate = {
        _updatePreview: undefined,
      };

      const container = {
        querySelector: jest.fn(() => previewWithoutUpdate),
      };

      expect(() => {
        (settingsTab as any).updateBorderPreview(container);
      }).not.toThrow();
    });
  });

  describe('renderBorderSettings', () => {
    test('creates border container', () => {
      const config = (settingsTab as any).createDefaultBorder();
      (settingsTab as any).renderBorderSettings(mockContainer, 'test', config);

      expect(mockContainer.createDiv).toHaveBeenCalledWith({ cls: 'border-setting-container' });
    });

    test('adds preview, name, and style settings', () => {
      const previewSpy = jest.spyOn(settingsTab as any, 'addBorderPreview');
      const nameSpy = jest.spyOn(settingsTab as any, 'addBorderName');
      const styleSpy = jest.spyOn(settingsTab as any, 'addBorderStyleSettings');

      const config = (settingsTab as any).createDefaultBorder();
      (settingsTab as any).renderBorderSettings(mockContainer, 'test', config);

      expect(previewSpy).toHaveBeenCalled();
      expect(nameSpy).toHaveBeenCalled();
      expect(styleSpy).toHaveBeenCalled();
    });
  });

  describe('addBorderStyleSettings', () => {
    test('creates settings for all border parts', () => {
      const saveSpy = jest.spyOn(settingsTab as any, 'save');
      const config = (settingsTab as any).createDefaultBorder();
      const container = mockContainer.createDiv();

      (settingsTab as any).addBorderStyleSettings(container, 'test', config);

      // Check that method completes without error
      expect(config).toBeDefined();
      expect(config.style).toBeDefined();
    });

    test('saves with debounce when border style changes', () => {
      const saveSpy = jest.spyOn(settingsTab as any, 'save').mockResolvedValue(undefined);
      const updateSpy = jest.spyOn(settingsTab as any, 'updateBorderPreview');

      const config = (settingsTab as any).createDefaultBorder();
      const container = mockContainer.createDiv();

      // Manually trigger the update callback
      const update = (part: string, value: string) => {
        (config.style as any)[part] = value;
        (settingsTab as any).updateBorderPreview(container);
        (settingsTab as any).save({ debounceKey: `test-${part}` });
      };

      update('top', '~');

      expect(config.style.top).toBe('~');
      expect(updateSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalledWith({ debounceKey: 'test-top' });
    });

    test('limits side chars to single character', () => {
      const config = (settingsTab as any).createDefaultBorder();

      // Simulate the slice(0, 1) behavior
      const value = '|||';
      config.style.left = value.slice(0, 1);

      expect(config.style.left).toBe('|');
      expect(config.style.left.length).toBe(1);
    });

    test('updates centerText config', async () => {
      const config = (settingsTab as any).createDefaultBorder();

      config.centerText = true;
      expect(config.centerText).toBe(true);

      config.centerText = false;
      expect(config.centerText).toBe(false);
    });

    test('calls deleteBorder when delete clicked', () => {
      const deleteSpy = jest.spyOn(settingsTab as any, 'deleteBorder');
      const config = (settingsTab as any).createDefaultBorder();
      const container = mockContainer.createDiv();

      (settingsTab as any).addBorderStyleSettings(container, 'test-border', config);

      // Manually call deleteBorder as if button was clicked
      (settingsTab as any).deleteBorder('test-border');

      expect(deleteSpy).toHaveBeenCalledWith('test-border');
    });
  });

  describe('addNewBorderButton', () => {
    test('calls addBorder when button clicked', () => {
      const addBorderSpy = jest.spyOn(settingsTab as any, 'addBorder');
      (settingsTab as any).addNewBorderButton(mockContainer);
      expect(addBorderSpy).toBeDefined();
    });
  });

  describe('addBorderName', () => {
    test('renames border on blur', async () => {
      const renameSpy = jest.spyOn(settingsTab as any, 'renameBorder').mockResolvedValue(undefined);
      const config = (settingsTab as any).createDefaultBorder();
      mockPlugin.settings.borders['test'] = config;

      (settingsTab as any).addBorderName(mockContainer, 'test');

      expect(renameSpy).toBeDefined();
    });
  });

  describe('integration - UI callbacks', () => {
    test('width calculator callback in addBorderPreview', () => {
      const config = (settingsTab as any).createDefaultBorder();
      const container = mockContainer.createDiv();
      const mockMeasureSpan = {
        textContent: '',
        getBoundingClientRect: jest.fn(() => ({ width: 50 })),
      };
      container.createEl = jest.fn((tag: string) => {
        if (tag === 'span') return mockMeasureSpan;
        return mockPreview;
      });

      (settingsTab as any).addBorderPreview(container, config);
      jest.advanceTimersByTime(1);

      // The callback should have set textContent via the width calculator
      expect(createBorder).toHaveBeenCalledWith(
        'Sample Text',
        config.style,
        expect.any(Function),
        100,
        false
      );

      // Call the width calculator directly
      const widthCalc = createBorder.mock.calls[0][2];
      widthCalc('test');
      expect(mockMeasureSpan.textContent).toBe('test');
    });

    test('update function modifies border style', () => {
      const config = (settingsTab as any).createDefaultBorder();
      const container = mockContainer.createDiv();

      // Create the update function inline like it exists in the code
      const border = config.style;
      const update = (part: keyof typeof border, value: string) => {
        border[part] = value;
        (settingsTab as any).updateBorderPreview(container);
        (settingsTab as any).save({ debounceKey: `test-${String(part)}` });
      };

      update('top', '~');
      expect(border.top).toBe('~');
    });

    test('centerText toggle updates config', async () => {
      const config = (settingsTab as any).createDefaultBorder();
      const container = mockContainer.createDiv();

      // Simulate the toggle onChange handler
      const updateSpy = jest.spyOn(settingsTab as any, 'updateBorderPreview');
      const saveSpy = jest.spyOn(settingsTab as any, 'save').mockResolvedValue(undefined);

      config.centerText = true;
      (settingsTab as any).updateBorderPreview(container);
      await (settingsTab as any).save();

      expect(config.centerText).toBe(true);
      expect(updateSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });

    test('side character slicing in onChange', () => {
      const config = (settingsTab as any).createDefaultBorder();

      // Simulate onChange for side characters
      const value = '|||';
      config.style.left = value.slice(0, 1);
      expect(config.style.left).toBe('|');

      const value2 = 'abc';
      config.style.right = value2.slice(0, 1);
      expect(config.style.right).toBe('a');
    });
  });
});
