import { getMonospaceCharWidth } from 'src/charWidthCache';
import {
	BORDER_OVERHEAD,
	FALLBACK_WIDTH
} from './constants';

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

	if (widthPx <= 0) {
		return FALLBACK_WIDTH - BORDER_OVERHEAD;
	}

	// Measure a single monospace character and cache it
	const charWidth = getMonospaceCharWidth(container, measureSpan);
	const charsAvailable = Math.floor(widthPx / charWidth);

	return Math.max(0, charsAvailable - BORDER_OVERHEAD);
}

export function wrapLine(line: string, maxWidth: number): string[] {
    if (line.length <= maxWidth) {
        return [line];
    }

    const wrapped: string[] = [];
    let start = 0;

    while (start < line.length) {
        wrapped.push(line.slice(start, start + maxWidth));
        start += maxWidth;
    }

    return wrapped;
}

