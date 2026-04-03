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
  // Use Array.from to properly handle surrogate pairs (e.g., Egyptian hieroglyphs)
  const chars = Array.from(line);

  if (chars.length <= maxWidth) {
    return [line];
  }

  const wrapped: string[] = [];
  let start = 0;

  while (start < chars.length) {
    wrapped.push(chars.slice(start, start + maxWidth).join(''));
    start += maxWidth;
  }

  return wrapped;
}
