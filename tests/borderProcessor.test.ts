import { describe, expect, test } from '@jest/globals';
import { createBorder } from '../src/borders/processor';
import { BorderStyle } from '../src/utils/types';

describe('borderProcessor', () => {
  const simpleBorder: BorderStyle = {
    top: '═',
    bottom: '═',
    left: '║',
    right: '║',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
  };

  const fancyBorder: BorderStyle = {
    top: '══✧══',
    bottom: '══✧══',
    left: '║',
    right: '║',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
  };

  // Simple measureWidth that returns char count
  const measureWidth = (text: string) => text.length;

  describe('createBorder', () => {
    test('creates border around single line text', () => {
      const result = createBorder('Hello', simpleBorder, measureWidth, 10);
      const lines = result.split('\n');

      expect(lines.length).toBe(3); // top + content + bottom
      expect(lines[0]).toContain('╔');
      expect(lines[0]).toContain('╗');
      expect(lines[1]).toContain('║');
      expect(lines[1]).toContain('Hello');
      expect(lines[2]).toContain('╚');
      expect(lines[2]).toContain('╝');
    });

    test('creates border around multi-line text', () => {
      const result = createBorder('Line1\nLine2\nLine3', simpleBorder, measureWidth, 10);
      const lines = result.split('\n');

      expect(lines.length).toBe(5); // top + 3 content + bottom
      expect(lines[1]).toContain('Line1');
      expect(lines[2]).toContain('Line2');
      expect(lines[3]).toContain('Line3');
    });

    test('handles empty text', () => {
      const result = createBorder('', simpleBorder, measureWidth, 10);
      const lines = result.split('\n');

      expect(lines.length).toBe(3); // top + empty content + bottom
      expect(lines[1]).toMatch(/║\s+║/);
    });

    test('wraps long lines to target width', () => {
      const longText = 'a'.repeat(50);
      const result = createBorder(longText, simpleBorder, measureWidth, 20);
      const lines = result.split('\n');

      // Should wrap into multiple lines
      expect(lines.length).toBeGreaterThan(3);

      // Check content lines don't exceed width (excluding borders and padding)
      for (let i = 1; i < lines.length - 1; i++) {
        const content = lines[i].replace(/║/g, '').trim();
        expect(content.length).toBeLessThanOrEqual(20);
      }
    });

    test('centers text when centerText is true', () => {
      const result = createBorder('Hi', simpleBorder, measureWidth, 10, true);
      const lines = result.split('\n');
      const contentLine = lines[1];

      // Content should be centered with padding on both sides
      const beforeText = contentLine.indexOf('Hi');
      const afterText = contentLine.length - contentLine.indexOf('Hi') - 2;

      // Should have roughly equal padding (within 1 char due to rounding)
      expect(Math.abs(beforeText - afterText)).toBeLessThanOrEqual(1);
    });

    test('left-aligns text when centerText is false', () => {
      const result = createBorder('Hi', simpleBorder, measureWidth, 10, false);
      const lines = result.split('\n');
      const contentLine = lines[1];

      // Text should appear early in line after left border and padding
      expect(contentLine).toMatch(/║\s\sHi/);
    });

    test('handles surrogate pair characters', () => {
      const emoji = '👨‍👩‍👧‍👦'; // Family emoji with ZWJ
      const result = createBorder(emoji, simpleBorder, measureWidth, 20);

      expect(result).toContain(emoji);
    });

    test('uses fancy border patterns correctly', () => {
      const result = createBorder('Test', fancyBorder, measureWidth, 20);
      const lines = result.split('\n');

      expect(lines[0]).toContain('✧');
      expect(lines[lines.length - 1]).toContain('✧');
    });

    test('handles text with whitespace', () => {
      const result = createBorder('  spaced  ', simpleBorder, measureWidth, 20);

      expect(result).toContain('  spaced  ');
    });

    test('handles text with tabs', () => {
      const result = createBorder('tab\there', simpleBorder, measureWidth, 20);

      expect(result).toContain('tab\there');
    });

    test('adjusts width to longest line if targetWidth too small', () => {
      const longLine = 'x'.repeat(30);
      const result = createBorder(longLine, simpleBorder, measureWidth, 10);
      const lines = result.split('\n');

      // All lines should be same length
      const topLength = lines[0].length;
      expect(lines.every((line) => line.length === topLength)).toBe(true);
    });

    test('handles very small target width', () => {
      // Target width smaller than content wraps text
      const result = createBorder('Test', simpleBorder, measureWidth, 2);

      // Text should be wrapped
      expect(result).toContain('Te');
      expect(result).toContain('st');
      expect(result).toContain('╔');
      expect(result).toContain('╚');
    });

    test('preserves empty lines in multi-line text', () => {
      const result = createBorder('Line1\n\nLine3', simpleBorder, measureWidth, 10);
      const lines = result.split('\n');

      expect(lines.length).toBe(5); // top + 3 content lines + bottom
      expect(lines[2]).toMatch(/║\s+║/); // Empty line should have padding
    });

    test('handles multiple consecutive newlines', () => {
      const result = createBorder('A\n\n\nB', simpleBorder, measureWidth, 10);
      const lines = result.split('\n');

      expect(lines.length).toBe(6); // top + 4 content + bottom
    });

    test('handles empty border pattern', () => {
      const emptyPatternBorder: BorderStyle = {
        top: '',
        bottom: '',
        left: '│',
        right: '│',
        topLeft: '┌',
        topRight: '┐',
        bottomLeft: '└',
        bottomRight: '┘',
      };

      const result = createBorder('Test', emptyPatternBorder, measureWidth, 10);

      expect(result).toContain('Test');
      expect(result).toContain('┌');
      expect(result).toContain('└');
    });

    test('handles pattern wider than available space', () => {
      const wideBorder: BorderStyle = {
        top: '═'.repeat(100),
        bottom: '═'.repeat(100),
        left: '║',
        right: '║',
        topLeft: '╔',
        topRight: '╗',
        bottomLeft: '╚',
        bottomRight: '╝',
      };

      // Very narrow width forces pattern to be wider than target
      const result = createBorder('Hi', wideBorder, measureWidth, 5);

      expect(result).toContain('Hi');
      expect(result).toContain('╔');
      expect(result).toContain('╚');
    });

    test('handles measureWidth returning zero', () => {
      const zeroMeasure = () => 0;
      const result = createBorder('Test', simpleBorder, zeroMeasure, 10);

      // Should handle zero widths gracefully
      expect(result).toContain('Test');
    });

    test('handles completely empty input', () => {
      const result = createBorder('', simpleBorder, measureWidth, 10);

      const lines = result.split('\n');
      expect(lines.length).toBe(3); // top + empty content + bottom
      expect(lines[0]).toContain('╔');
      expect(lines[2]).toContain('╚');
    });

    test('handles text that results in empty lines array', () => {
      // This shouldn't happen in practice but guard against it
      const result = createBorder('\n\n', simpleBorder, measureWidth, 10);

      expect(result).toContain('╔');
      expect(result).toContain('╚');
      expect(result).toBeTruthy();
    });
  });
});
