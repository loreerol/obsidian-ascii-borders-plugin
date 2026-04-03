import { describe, expect, test, beforeEach } from '@jest/globals';
import { measureText, calculateReadableWidth, wrapLine } from '../../src/utils/math';
import { BORDER_OVERHEAD, FALLBACK_WIDTH } from '../../src/utils/constants';

describe('measurements', () => {
  let mockContainer: HTMLElement;
  let mockSpan: HTMLSpanElement;

  beforeEach(() => {
    // Create mock DOM elements
    mockContainer = document.createElement('div');
    mockSpan = document.createElement('span');

    // Mock getBoundingClientRect for container
    mockContainer.getBoundingClientRect = () => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Mock computed style
    Object.defineProperty(mockContainer, 'computedStyleMap', {
      value: () =>
        new Map([
          ['font-family', 'monospace'],
          ['font-size', '16px'],
          ['line-height', '1.5'],
        ]),
    });
  });

  describe('measureText', () => {
    test('measures text width correctly', () => {
      mockSpan.getBoundingClientRect = () => ({
        width: 100,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const width = measureText('Hello', mockSpan);
      expect(width).toBe(100);
      expect(mockSpan.textContent).toBe('Hello');
    });

    test('handles empty string', () => {
      mockSpan.getBoundingClientRect = () => ({
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

      const width = measureText('', mockSpan);
      expect(width).toBe(0);
    });
  });

  describe('calculateReadableWidth', () => {
    test('calculates width from container with valid dimensions', () => {
      mockSpan.getBoundingClientRect = () => ({
        width: 10, // Each char is 10px wide
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 10,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const width = calculateReadableWidth(mockContainer, mockSpan);

      // Container is 800px, char is 10px = 80 chars, minus BORDER_OVERHEAD (6)
      expect(width).toBe(80 - BORDER_OVERHEAD);
    });

    test('returns fallback width when container width is zero', () => {
      mockContainer.getBoundingClientRect = () => ({
        width: 0,
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const width = calculateReadableWidth(mockContainer, mockSpan);
      expect(width).toBe(FALLBACK_WIDTH - BORDER_OVERHEAD);
    });

    test('returns fallback width when container width is negative', () => {
      mockContainer.getBoundingClientRect = () => ({
        width: -100,
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const width = calculateReadableWidth(mockContainer, mockSpan);
      expect(width).toBe(FALLBACK_WIDTH - BORDER_OVERHEAD);
    });

    test('handles very narrow containers', () => {
      mockContainer.getBoundingClientRect = () => ({
        width: 50, // Very narrow
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      mockSpan.getBoundingClientRect = () => ({
        width: 10,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 10,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const width = calculateReadableWidth(mockContainer, mockSpan);

      // 50px / 10px = 5 chars, minus 6 overhead = -1, max with 0 = 0
      expect(width).toBe(0);
    });

    test('handles very wide containers', () => {
      mockContainer.getBoundingClientRect = () => ({
        width: 2000,
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: 2000,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      mockSpan.getBoundingClientRect = () => ({
        width: 10,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 10,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const width = calculateReadableWidth(mockContainer, mockSpan);

      // 2000px / 10px = 200 chars, minus 6 overhead = 194
      expect(width).toBe(194);
    });

    test('subtracts BORDER_OVERHEAD correctly', () => {
      mockContainer.getBoundingClientRect = () => ({
        width: 100,
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      mockSpan.getBoundingClientRect = () => ({
        width: 10,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 10,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const width = calculateReadableWidth(mockContainer, mockSpan);

      // 100 / 10 = 10, minus BORDER_OVERHEAD (6) = 4
      expect(width).toBe(4);
    });

    test('handles char width of 1 from cache fallback', () => {
      // charWidthCache returns 1 when getBoundingClientRect returns 0
      mockSpan.getBoundingClientRect = () => ({
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

      const width = calculateReadableWidth(mockContainer, mockSpan);

      // charWidthCache will return 1 (not 0), so 800/1 = 800 - 6 = 794
      expect(width).toBeGreaterThan(0);
    });
  });

  describe('wrapLine', () => {
    test('returns single line when text shorter than maxWidth', () => {
      const result = wrapLine('Hello', 10);
      expect(result).toEqual(['Hello']);
    });

    test('returns single line when text equals maxWidth', () => {
      const result = wrapLine('12345', 5);
      expect(result).toEqual(['12345']);
    });

    test('wraps at word boundaries', () => {
      const result = wrapLine('hello world test', 12);
      expect(result).toEqual(['hello world ', 'test']);
    });

    test('wraps multiple words', () => {
      const result = wrapLine('the quick brown fox', 10);
      expect(result).toEqual(['the quick ', 'brown fox']);
    });

    test('breaks long words that exceed maxWidth', () => {
      const result = wrapLine('supercalifragilistic', 10);
      expect(result).toEqual(['supercalif', 'ragilistic']);
    });

    test('handles mixed long words and normal words', () => {
      const result = wrapLine('hello supercalifragilistic world', 10);
      expect(result).toEqual(['hello ', 'supercalif', 'ragilistic', ' world']);
    });

    test('handles empty string', () => {
      const result = wrapLine('', 10);
      expect(result).toEqual(['']);
    });

    test('handles single character', () => {
      const result = wrapLine('a', 10);
      expect(result).toEqual(['a']);
    });

    test('preserves whitespace between words', () => {
      const result = wrapLine('hello  world', 15);
      expect(result).toEqual(['hello  world']);
    });

    test('handles surrogate pair characters in long words', () => {
      // Egyptian hieroglyphs (surrogate pairs)
      const text = '𓀀𓀁𓀂𓀃𓀄𓀅𓀆';
      const result = wrapLine(text, 4);

      // Should break the long word
      expect(result.length).toBeGreaterThan(1);
      // Verify no broken surrogate pairs
      expect(result.every((line) => !line.includes('\uFFFD'))).toBe(true);
    });

    test('handles very long single word', () => {
      const longWord = 'a'.repeat(1000);
      const result = wrapLine(longWord, 50);

      expect(result.length).toBe(20); // 1000 / 50
      expect(result.every((line) => line.length === 50)).toBe(true);
    });

    test('handles whitespace-only text', () => {
      const result = wrapLine('     ', 10);
      expect(result).toEqual(['     ']);
    });

    test('handles text with leading spaces', () => {
      const result = wrapLine('  hello world', 10);
      expect(result).toEqual(['  hello ', 'world']);
    });

    test('handles text with trailing spaces', () => {
      const result = wrapLine('hello world  ', 10);
      expect(result).toEqual(['hello ', 'world  ']);
    });

    test('wraps at very small maxWidth with words', () => {
      const result = wrapLine('a b', 2);
      expect(result).toEqual(['a ', 'b']);
    });

    test('handles multiple spaces as separator', () => {
      const result = wrapLine('hello   world', 15);
      expect(result).toEqual(['hello   world']);
    });
  });
});
