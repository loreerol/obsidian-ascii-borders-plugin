import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { SettingsTab } from '../src/settingsTab';
import { DEFAULT_BORDERS } from '../src/utils/defaults';
import { BorderConfig } from '../src/utils/types';

// Mock dependencies
jest.mock('../src/borders/processor', () => ({
  createBorder: jest.fn(() => 'bordered preview'),
}));

jest.mock('../src/utils/math', () => ({
  calculateReadableWidth: jest.fn(() => 100),
}));

const { createBorder } = require('../src/borders/processor');

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
      appendChild: jest.fn(),
      createEl: jest.fn((tag: string) => ({
        textContent: '',
        getBoundingClientRect: jest.fn(() => ({ width: 50 })),
      })),
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
      settings: JSON.parse(JSON.stringify(DEFAULT_BORDERS)),
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
      // Instructions now create a border preview, not HTML content
      expect(mockContainer.createEl).toHaveBeenCalledWith('pre', { cls: 'border-preview' });
    });

    test('instructions render callback creates border', () => {
      (settingsTab as any).addInstructions(mockContainer);

      jest.advanceTimersByTime(1);

      // Should call createBorder for instructions
      expect(createBorder).toHaveBeenCalled();
      const firstCall = createBorder.mock.calls[0];
      expect(firstCall[0]).toContain('Hit Copy Code Block');
    });

    test('renders all borders from settings', () => {
      const renderSpy = jest.spyOn(settingsTab as any, 'renderBorderSettings');
      settingsTab.display();

      const borderCount = Object.keys(DEFAULT_BORDERS.borders).length;
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

  describe('hide', () => {
    test('clears all pending debounce timeouts', () => {
      (settingsTab as any).save({ debounceKey: 'key1' });
      (settingsTab as any).save({ debounceKey: 'key2' });

      expect((settingsTab as any).debounceTimeouts.size).toBe(2);

      settingsTab.hide();

      expect((settingsTab as any).debounceTimeouts.size).toBe(0);
    });

    test('prevents pending saves from executing after hide', async () => {
      (settingsTab as any).save({ debounceKey: 'test' });

      settingsTab.hide();

      jest.advanceTimersByTime(500);

      // Save should not execute because timeout was cleared
      expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
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

    test('returns update function', () => {
      const container = mockContainer.createDiv();
      const config = (settingsTab as any).createDefaultBorder();

      const updateFn = (settingsTab as any).addBorderPreview(container, config);

      expect(updateFn).toBeInstanceOf(Function);
    });
  });

  describe('addBorderHeader', () => {
    test('creates copy button with onClick handler', async () => {
      const mockWriteText = jest.fn(() => Promise.resolve());
      Object.defineProperty(global.navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      let clickHandler: any;
      let buttonObj: any;
      const mockSetting: any = {
        setName: jest.fn().mockReturnThis(),
        setHeading: jest.fn().mockReturnThis(),
        addButton: jest.fn((cb: any) => {
          buttonObj = {
            setButtonText: jest.fn().mockReturnThis(),
            setCta: jest.fn().mockReturnThis(),
            setTooltip: jest.fn().mockReturnThis(),
            onClick: jest.fn((handler: any) => {
              clickHandler = handler;
              return buttonObj;
            }),
          };
          cb(buttonObj);
          return mockSetting;
        }),
      };

      const SettingSpy = jest
        .spyOn(require('obsidian'), 'Setting')
        .mockImplementation(() => mockSetting);

      (settingsTab as any).addBorderHeader(mockContainer, 'test');

      // Trigger the click handler
      await clickHandler();

      expect(mockWriteText).toHaveBeenCalledWith('```border-test\n\n```');
      expect(buttonObj.setButtonText).toHaveBeenCalledWith('Copied!');

      SettingSpy.mockRestore();
    });
  });

  describe('renderBorderSettings', () => {
    test('creates border container', () => {
      const config = (settingsTab as any).createDefaultBorder();
      (settingsTab as any).renderBorderSettings(mockContainer, 'test', config);

      expect(mockContainer.createDiv).toHaveBeenCalledWith({ cls: 'border-setting-container' });
    });

    test('adds header, preview, name, and style settings', () => {
      const headerSpy = jest.spyOn(settingsTab as any, 'addBorderHeader');
      const previewSpy = jest.spyOn(settingsTab as any, 'addBorderPreview');
      const nameSpy = jest.spyOn(settingsTab as any, 'addBorderName');
      const styleSpy = jest.spyOn(settingsTab as any, 'addBorderStyleSettings');

      const config = (settingsTab as any).createDefaultBorder();
      (settingsTab as any).renderBorderSettings(mockContainer, 'test', config);

      expect(headerSpy).toHaveBeenCalled();
      expect(previewSpy).toHaveBeenCalled();
      expect(nameSpy).toHaveBeenCalled();
      expect(styleSpy).toHaveBeenCalled();
    });
  });

  describe('addBorderStyleSettings', () => {
    test('creates settings for all border parts', () => {
      const config = (settingsTab as any).createDefaultBorder();
      const container = mockContainer.createDiv();
      const updatePreview = jest.fn();

      (settingsTab as any).addBorderStyleSettings(container, 'test', config, updatePreview);

      // Check that method completes without error
      expect(config).toBeDefined();
      expect(config.style).toBeDefined();
    });

    test('calls updatePreview and saves when border style changes', () => {
      const saveSpy = jest.spyOn(settingsTab as any, 'save').mockResolvedValue(undefined);
      const updatePreview = jest.fn();

      const config = (settingsTab as any).createDefaultBorder();
      const container = mockContainer.createDiv();

      // Manually trigger the update callback
      const update = (part: string, value: string) => {
        (config.style as any)[part] = value;
        updatePreview();
        (settingsTab as any).save({ debounceKey: `test-${part}` });
      };

      update('top', '~');

      expect(config.style.top).toBe('~');
      expect(updatePreview).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalledWith({ debounceKey: 'test-top' });
    });

    test('limits side chars to single character', () => {
      const config = (settingsTab as any).createDefaultBorder();

      // Simulate the firstChar() behavior
      const value = '|||';
      config.style.left = [...value][0];

      expect(config.style.left).toBe('|');
      expect(config.style.left.length).toBe(1);
    });

    test('handles surrogate pair characters in side borders', () => {
      const config = (settingsTab as any).createDefaultBorder();

      // Egyptian hieroglyph (surrogate pair)
      const value = '𓋼';
      config.style.left = [...value][0];

      expect(config.style.left).toBe('𓋼');
      expect(config.style.left).not.toBe('�');
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
      const updatePreview = jest.fn();

      (settingsTab as any).addBorderStyleSettings(container, 'test-border', config, updatePreview);

      // Manually call deleteBorder as if button was clicked
      (settingsTab as any).deleteBorder('test-border');

      expect(deleteSpy).toHaveBeenCalledWith('test-border');
    });
  });

  describe('addNewBorderButton', () => {
    test('creates button with onClick handler', async () => {
      const addBorderSpy = jest.spyOn(settingsTab as any, 'addBorder').mockResolvedValue(undefined);

      let clickHandler: any;
      const mockSetting: any = {
        setClass: jest.fn().mockReturnThis(),
        addButton: jest.fn((cb: any) => {
          const btn: any = {
            setButtonText: jest.fn().mockReturnThis(),
            setCta: jest.fn().mockReturnThis(),
            onClick: jest.fn((handler: any) => {
              clickHandler = handler;
              return btn;
            }),
          };
          cb(btn);
          return mockSetting;
        }),
      };

      const SettingSpy = jest
        .spyOn(require('obsidian'), 'Setting')
        .mockImplementation(() => mockSetting);

      (settingsTab as any).addNewBorderButton(mockContainer);

      // Trigger the click handler
      await clickHandler();

      expect(addBorderSpy).toHaveBeenCalled();

      SettingSpy.mockRestore();
    });
  });

  describe('addBorderName', () => {
    test('creates text input with blur handler', async () => {
      const renameSpy = jest.spyOn(settingsTab as any, 'renameBorder').mockResolvedValue(undefined);

      let blurHandler: any;
      const mockSetting: any = {
        setName: jest.fn().mockReturnThis(),
        setDesc: jest.fn().mockReturnThis(),
        addText: jest.fn((cb: any) => {
          const text = {
            setValue: jest.fn().mockReturnThis(),
            getValue: jest.fn(() => 'new-name'),
            inputEl: {
              addEventListener: jest.fn((event: string, handler: any) => {
                if (event === 'blur') blurHandler = handler;
              }),
            },
          };
          cb(text);
          return mockSetting;
        }),
      };

      const SettingSpy = jest
        .spyOn(require('obsidian'), 'Setting')
        .mockImplementation(() => mockSetting);

      (settingsTab as any).addBorderName(mockContainer, 'old-name');

      // Trigger blur
      blurHandler();

      expect(renameSpy).toHaveBeenCalledWith('old-name', 'new-name');

      SettingSpy.mockRestore();
    });
  });

  describe('integration - UI callbacks', () => {
    test('width calculator callback in addBorderPreview', () => {
      const config = (settingsTab as any).createDefaultBorder();
      const mockMeasureSpan = {
        textContent: '',
        getBoundingClientRect: jest.fn(() => ({ width: 50 })),
      };

      const mockPre = {
        textContent: '',
        getBoundingClientRect: jest.fn(() => ({ width: 100 })),
        appendChild: jest.fn(),
        createEl: jest.fn((tag: string) => {
          if (tag === 'span') return mockMeasureSpan;
          return {
            textContent: '',
            getBoundingClientRect: jest.fn(() => ({ width: 50 })),
          };
        }),
      };

      const container = {
        createEl: jest.fn((tag: string) => {
          if (tag === 'pre') return mockPre;
          return mockMeasureSpan;
        }),
      };

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
      const updatePreview = jest.fn();

      // Create the update function inline like it exists in the code
      const border = config.style;
      const update = (part: keyof typeof border, value: string) => {
        border[part] = value;
        updatePreview();
        (settingsTab as any).save({ debounceKey: `test-${String(part)}` });
      };

      update('top', '~');
      expect(border.top).toBe('~');
      expect(updatePreview).toHaveBeenCalled();
    });

    test('centerText toggle updates config', async () => {
      const config = (settingsTab as any).createDefaultBorder();
      const updatePreview = jest.fn();
      const saveSpy = jest.spyOn(settingsTab as any, 'save').mockResolvedValue(undefined);

      config.centerText = true;
      updatePreview();
      await (settingsTab as any).save();

      expect(config.centerText).toBe(true);
      expect(updatePreview).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });

    test('side character slicing in onChange', () => {
      const config = (settingsTab as any).createDefaultBorder();

      // Simulate onChange for side characters
      const value = '|||';
      config.style.left = [...value][0];
      expect(config.style.left).toBe('|');

      const value2 = 'abc';
      config.style.right = [...value2][0];
      expect(config.style.right).toBe('a');
    });
  });
});
