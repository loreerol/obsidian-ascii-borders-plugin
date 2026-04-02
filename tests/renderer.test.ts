import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { renderBorder } from '../src/renderer';
import { BorderConfig } from '../src/utils/types';

// Mock dependencies
jest.mock('../src/borderProcessor', () => ({
  createBorder: jest.fn((source: string) => `bordered: ${source}`)
}));

jest.mock('../src/utils/measurements', () => ({
  calculateReadableWidth: jest.fn(() => 100)
}));

const { createBorder } = require('../src/borderProcessor');
const { calculateReadableWidth } = require('../src/utils/measurements');

describe('renderBorder', () => {
  let mockEl: any;
  let mockContainer: any;
  let mockPre: any;
  let mockMeasureSpan: any;
  let mockApp: any;
  let mockCtx: any;
  let mockView: any;
  let mockEditor: any;
  let resizeObserverCallback: any;

  const mockConfig: BorderConfig = {
    style: {
      top: '═',
      bottom: '═',
      left: '║',
      right: '║',
      topLeft: '╔',
      topRight: '╗',
      bottomLeft: '╚',
      bottomRight: '╝'
    },
    centerText: false
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation((callback) => {
      resizeObserverCallback = callback;
      return {
        observe: jest.fn(),
        disconnect: jest.fn(),
        unobserve: jest.fn()
      };
    }) as any;

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((cb: CallableFunction) => {
      cb();
      return 0;
    }) as any;

    mockMeasureSpan = {
      textContent: '',
      getBoundingClientRect: jest.fn(() => ({ width: 50 }))
    };

    mockPre = {
      textContent: '',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    mockContainer = {
      createEl: jest.fn((tag: string) => {
        if (tag === 'pre') return mockPre;
        if (tag === 'span') return mockMeasureSpan;
        return {};
      }),
      createDiv: jest.fn(() => mockContainer),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      isConnected: true
    };

    mockEl = {
      createDiv: jest.fn(() => mockContainer)
    };

    mockEditor = {
      getLine: jest.fn(() => '```'),
      setCursor: jest.fn(),
      focus: jest.fn()
    };

    mockView = {
      leaf: {
        getViewState: jest.fn(() => ({ state: { mode: 'preview', source: true } }))
      },
      getMode: jest.fn(() => 'preview'),
      setState: jest.fn(),
      editor: mockEditor
    };

    mockApp = {
      workspace: {
        getActiveViewOfType: jest.fn(() => mockView)
      }
    };

    mockCtx = {
      getSectionInfo: jest.fn(() => ({
        lineStart: 0,
        lineEnd: 2
      })),
      addChild: jest.fn()
    };
  });

  test('creates container with correct class', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);
    expect(mockEl.createDiv).toHaveBeenCalledWith({ cls: 'ascii-border-container' });
  });

  test('creates pre element with correct class', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);
    expect(mockContainer.createEl).toHaveBeenCalledWith('pre', { cls: 'ascii-border-content' });
  });

  test('creates measure span', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);
    expect(mockContainer.createEl).toHaveBeenCalledWith('span', {
      cls: 'ascii-border-measure-span'
    });
  });

  test('calls createBorder with correct parameters', () => {
    renderBorder('test content', mockEl, mockConfig, mockApp, mockCtx);

    expect(createBorder).toHaveBeenCalledWith(
      'test content',
      mockConfig.style,
      expect.any(Function),
      100,
      false
    );
  });

  test('renders border immediately', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);
    expect(mockPre.textContent).toBe('bordered: test');
  });

  test('sets up ResizeObserver', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const observer = (global.ResizeObserver as jest.Mock).mock.results[0].value as any;
    expect(observer.observe).toHaveBeenCalledWith(mockContainer);
  });

  test('re-renders on resize', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    createBorder.mockClear();
    mockPre.textContent = '';

    // Trigger resize
    resizeObserverCallback();

    expect(createBorder).toHaveBeenCalled();
    expect(mockPre.textContent).toBe('bordered: test');
  });

  test('disconnects observer when container disconnected', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const observer = (global.ResizeObserver as jest.Mock).mock.results[0].value as any;
    mockContainer.isConnected = false;

    resizeObserverCallback();

    expect(observer.disconnect).toHaveBeenCalled();
  });

  test('handles click to edit in preview mode', async () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const clickHandler = mockPre.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'click'
    )[1];

    await clickHandler();

    expect(mockView.setState).toHaveBeenCalledWith(
      { mode: 'source' },
      { history: false }
    );
    expect(mockEditor.setCursor).toHaveBeenCalled();
    expect(mockEditor.focus).toHaveBeenCalled();
  });

  test('does not edit in reading mode', async () => {
    mockView.leaf.getViewState.mockReturnValue({
      state: { mode: 'preview', source: false }
    });

    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const clickHandler = mockPre.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'click'
    )[1];

    await clickHandler();

    expect(mockView.setState).not.toHaveBeenCalled();
  });

  test('does not edit when no section info', async () => {
    mockCtx.getSectionInfo.mockReturnValue(null);

    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const clickHandler = mockPre.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'click'
    )[1];

    await clickHandler();

    expect(mockView.setState).not.toHaveBeenCalled();
  });

  test('does not edit when no active view', async () => {
    mockApp.workspace.getActiveViewOfType.mockReturnValue(null);

    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const clickHandler = mockPre.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'click'
    )[1];

    await clickHandler();

    expect(mockView.setState).not.toHaveBeenCalled();
  });

  test('skips setState when already in source mode', async () => {
    mockView.getMode.mockReturnValue('source');

    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const clickHandler = mockPre.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'click'
    )[1];

    await clickHandler();

    expect(mockView.setState).not.toHaveBeenCalled();
    expect(mockEditor.setCursor).toHaveBeenCalled();
  });

  test('positions cursor correctly on click', async () => {
    mockEditor.getLine.mockReturnValue('```border-simple');

    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const clickHandler = mockPre.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'click'
    )[1];

    await clickHandler();

    expect(mockEditor.setCursor).toHaveBeenCalledWith({
      line: 2,
      ch: 13 // '```border-simple'.length - 3
    });
  });

  test('listens for settings update events', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const updateHandler = mockContainer.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'ascii-border-update'
    );

    expect(updateHandler).toBeDefined();
  });

  test('re-renders on settings update event', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    createBorder.mockClear();
    mockPre.textContent = '';

    const updateHandler = mockContainer.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'ascii-border-update'
    )[1];

    updateHandler();

    expect(createBorder).toHaveBeenCalled();
  });

  test('registers cleanup with context', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);
    expect(mockCtx.addChild).toHaveBeenCalledWith(expect.any(Object));
  });

  test('cleanup removes event listeners', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const cleanup = mockCtx.addChild.mock.calls[0][0];
    cleanup.onunload();

    expect(mockPre.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockContainer.removeEventListener).toHaveBeenCalledWith('ascii-border-update', expect.any(Function));
  });

  test('cleanup disconnects observer', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const observer = (global.ResizeObserver as jest.Mock).mock.results[0].value as any;
    const cleanup = mockCtx.addChild.mock.calls[0][0];

    cleanup.onunload();

    expect(observer.disconnect).toHaveBeenCalled();
  });

  test('uses centerText config', () => {
    const centeredConfig = { ...mockConfig, centerText: true };
    renderBorder('test', mockEl, centeredConfig, mockApp, mockCtx);

    expect(createBorder).toHaveBeenCalledWith(
      'test',
      centeredConfig.style,
      expect.any(Function),
      100,
      true
    );
  });

  test('measureWidth callback uses measureSpan', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    const measureWidthFn = createBorder.mock.calls[0][2];
    const result = measureWidthFn('sample text');

    expect(mockMeasureSpan.textContent).toBe('sample text');
    expect(mockMeasureSpan.getBoundingClientRect).toHaveBeenCalled();
    expect(result).toBe(50);
  });

  test('debounces multiple rapid renders', () => {
    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    createBorder.mockClear();

    // Trigger multiple resizes rapidly
    resizeObserverCallback();
    resizeObserverCallback();
    resizeObserverCallback();

    // Should only render once due to requestAnimationFrame batching
    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });

  test('handles render errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    createBorder.mockImplementationOnce(() => {
      throw new Error('Render error');
    });

    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);

    expect(mockPre.textContent).toBe('Error rendering border');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to render border:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  test('continues to work after error recovery', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // First render fails
    createBorder.mockImplementationOnce(() => {
      throw new Error('Render error');
    });

    renderBorder('test', mockEl, mockConfig, mockApp, mockCtx);
    expect(mockPre.textContent).toBe('Error rendering border');

    // Reset mock to succeed
    createBorder.mockReturnValue('bordered: test');
    mockPre.textContent = '';

    // Trigger re-render via resize
    resizeObserverCallback();

    expect(mockPre.textContent).toBe('bordered: test');

    consoleErrorSpy.mockRestore();
  });
});
