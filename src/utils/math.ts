import { getMonospaceCharWidth } from 'src/utils/charWidthCache';
import { BORDER_OVERHEAD, FALLBACK_WIDTH } from './constants';

// Measure the pixel width of a text string when rendered in monospace font
export function measureText(text: string, span: HTMLSpanElement): number {
  span.textContent = text;
  return span.getBoundingClientRect().width;
}

export function calculateReadableWidth(
  container: HTMLElement,
  measureSpan: HTMLSpanElement
): number {
  const widthPx = container.getBoundingClientRect().width;
  // Measure a single monospace character and cache it
  const charWidth = getMonospaceCharWidth(container, measureSpan);

  if (widthPx <= 0 || charWidth <= 0) {
    return FALLBACK_WIDTH - BORDER_OVERHEAD;
  }

  const charsAvailable = Math.floor(widthPx / charWidth);

  return Math.max(0, charsAvailable - BORDER_OVERHEAD);
}

export function wrapLine(line: string, maxWidth: number): string[] {
  if (line.length <= maxWidth) {
    return [line];
  }

  const wrapped: string[] = [];
  const words = line.split(/(\s+)/); // Split on whitespace, keeping whitespace
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + word;

    if (testLine.length <= maxWidth) {
      currentLine = testLine;
    } else {
      // Word would exceed maxWidth
      if (currentLine.length > 0) {
        wrapped.push(currentLine);
        currentLine = '';
      }

      // Handle words longer than maxWidth - break them
      if (word.length > maxWidth) {
        const chars = Array.from(word);
        let start = 0;
        while (start < chars.length) {
          const chunk = chars.slice(start, start + maxWidth).join('');
          if (currentLine.length > 0) {
            wrapped.push(currentLine);
            currentLine = chunk;
          } else {
            wrapped.push(chunk);
          }
          start += maxWidth;
        }
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine.length > 0) {
    wrapped.push(currentLine);
  }

  return wrapped.length > 0 ? wrapped : [''];
}
