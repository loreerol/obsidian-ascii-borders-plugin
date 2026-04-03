import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { getMonospaceCharWidth } from '../src/utils/charWidthCache';

describe('charWidthCache', () => {
  let originalGetComputedStyle: typeof window.getComputedStyle;

  beforeEach(() => {
    // Mock getComputedStyle
    originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = ((element: Element) => {
      const htmlElement = element as HTMLElement;
      return {
        fontFamily: htmlElement.style.fontFamily || 'monospace',
        fontSize: htmlElement.style.fontSize || '16px',
        lineHeight: htmlElement.style.lineHeight || '1.5',
      } as CSSStyleDeclaration;
    }) as typeof window.getComputedStyle;
  });

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle;
  });

  test('measures character width on first call', () => {
    const mockContainer = document.createElement('div');
    const mockSpan = document.createElement('span');
    mockContainer.style.fontFamily = 'test-font-1';
    mockContainer.style.fontSize = '16px';
    mockContainer.style.lineHeight = '1.5';

    let measureCount = 0;
    mockSpan.getBoundingClientRect = () => {
      measureCount++;
      return {
        width: 10,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 10,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };

    const width = getMonospaceCharWidth(mockContainer, mockSpan);

    expect(width).toBe(10);
    expect(measureCount).toBeGreaterThanOrEqual(1);
    expect(mockSpan.textContent).toBe(' ');
  });

  test('returns cached value on subsequent calls with same font', () => {
    const mockContainer = document.createElement('div');
    const mockSpan = document.createElement('span');
    mockContainer.style.fontFamily = 'test-font-2';
    mockContainer.style.fontSize = '17px';
    mockContainer.style.lineHeight = '1.6';

    let measureCount = 0;
    mockSpan.getBoundingClientRect = () => {
      measureCount++;
      return {
        width: 11,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 11,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };

    const width1 = getMonospaceCharWidth(mockContainer, mockSpan);
    const width2 = getMonospaceCharWidth(mockContainer, mockSpan);
    const width3 = getMonospaceCharWidth(mockContainer, mockSpan);

    expect(width1).toBe(11);
    expect(width2).toBe(11);
    expect(width3).toBe(11);
    expect(measureCount).toBe(1); // Should only measure once
  });

  test('measures again when font family changes', () => {
    const mockContainer = document.createElement('div');
    const mockSpan = document.createElement('span');

    let measureCount = 0;
    mockSpan.getBoundingClientRect = () => {
      measureCount++;
      return {
        width: measureCount === 1 ? 12 : 24,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: measureCount === 1 ? 12 : 24,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };

    mockContainer.style.fontFamily = 'test-font-3';
    mockContainer.style.fontSize = '18px';
    mockContainer.style.lineHeight = '1.7';
    const width1 = getMonospaceCharWidth(mockContainer, mockSpan);

    mockContainer.style.fontFamily = 'test-font-4';
    const width2 = getMonospaceCharWidth(mockContainer, mockSpan);

    expect(width1).toBe(12);
    expect(width2).toBe(24);
    expect(measureCount).toBe(2);
  });

  test('measures again when font size changes', () => {
    const mockContainer = document.createElement('div');
    const mockSpan = document.createElement('span');

    let measureCount = 0;
    mockSpan.getBoundingClientRect = () => {
      measureCount++;
      return {
        width: measureCount === 1 ? 13 : 26,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: measureCount === 1 ? 13 : 26,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };

    mockContainer.style.fontFamily = 'test-font-5';
    mockContainer.style.fontSize = '19px';
    mockContainer.style.lineHeight = '1.8';
    const width1 = getMonospaceCharWidth(mockContainer, mockSpan);

    mockContainer.style.fontSize = '20px';
    const width2 = getMonospaceCharWidth(mockContainer, mockSpan);

    expect(width1).toBe(13);
    expect(width2).toBe(26);
    expect(measureCount).toBe(2);
  });

  test('measures again when line height changes', () => {
    const mockContainer = document.createElement('div');
    const mockSpan = document.createElement('span');

    let measureCount = 0;
    mockSpan.getBoundingClientRect = () => {
      measureCount++;
      return {
        width: measureCount === 1 ? 14 : 28,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: measureCount === 1 ? 14 : 28,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };

    mockContainer.style.fontFamily = 'test-font-6';
    mockContainer.style.fontSize = '21px';
    mockContainer.style.lineHeight = '1.9';
    const width1 = getMonospaceCharWidth(mockContainer, mockSpan);

    mockContainer.style.lineHeight = '2.0';
    const width2 = getMonospaceCharWidth(mockContainer, mockSpan);

    expect(width1).toBe(14);
    expect(width2).toBe(28);
    expect(measureCount).toBe(2);
  });

  test('creates unique cache keys for different font properties', () => {
    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    const span = document.createElement('span');

    container1.style.fontFamily = 'test-font-7';
    container1.style.fontSize = '22px';
    container1.style.lineHeight = '2.1';

    container2.style.fontFamily = 'test-font-8';
    container2.style.fontSize = '22px';
    container2.style.lineHeight = '2.1';

    let measureCount = 0;
    span.getBoundingClientRect = () => {
      measureCount++;
      return {
        width: 15 + measureCount,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 15 + measureCount,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };

    const width1 = getMonospaceCharWidth(container1, span);
    const width2 = getMonospaceCharWidth(container2, span);

    expect(width1).not.toBe(width2);
    expect(measureCount).toBe(2);
  });

  test('handles zero width measurement with fallback', () => {
    const freshContainer = document.createElement('div');
    const freshSpan = document.createElement('span');

    freshContainer.style.fontFamily = 'zero-width-font';
    freshContainer.style.fontSize = '1px';
    freshContainer.style.lineHeight = '1';

    freshSpan.getBoundingClientRect = () => ({
      width: 0,
      height: 20,
      top: 0,
      left: 0,
      bottom: 20,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const width = getMonospaceCharWidth(freshContainer, freshSpan);

    // Should fallback to 1 if width is 0
    expect(width).toBe(1);
  });

  test('caches multiple different font configurations', () => {
    const containers = [
      { family: 'test-font-9', size: '23px', lineHeight: '2.2' },
      { family: 'test-font-10', size: '24px', lineHeight: '2.3' },
      { family: 'test-font-11', size: '25px', lineHeight: '2.4' },
    ];

    const widths: number[] = [];

    containers.forEach((config, index) => {
      const container = document.createElement('div');
      const span = document.createElement('span');

      container.style.fontFamily = config.family;
      container.style.fontSize = config.size;
      container.style.lineHeight = config.lineHeight;

      span.getBoundingClientRect = () => ({
        width: 20 + index * 2,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 20 + index * 2,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      widths.push(getMonospaceCharWidth(container, span));
    });

    // All widths should be different and cached
    expect(widths[0]).toBe(20);
    expect(widths[1]).toBe(22);
    expect(widths[2]).toBe(24);
    expect(new Set(widths).size).toBe(3);
  });

  test('handles identical font properties for different containers', () => {
    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    const span = document.createElement('span');

    // Same font properties
    [container1, container2].forEach((c) => {
      c.style.fontFamily = 'test-font-12';
      c.style.fontSize = '26px';
      c.style.lineHeight = '2.5';
    });

    let measureCount = 0;
    span.getBoundingClientRect = () => {
      measureCount++;
      return {
        width: 16,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 16,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };

    const width1 = getMonospaceCharWidth(container1, span);
    const width2 = getMonospaceCharWidth(container2, span);

    expect(width1).toBe(width2);
    expect(measureCount).toBe(1); // Should use cache for second container
  });
});
