import { 
	BORDER_OVERHEAD, 
	FALLBACK_WIDTH 
} from './constants';

// Create a hidden span element for measuring text width in pixels
export function createMeasureSpan(element: HTMLElement): HTMLSpanElement {
	const span = element.ownerDocument.createElement('span');
	span.className = 'ascii-border-measure-span';
	element.appendChild(span);
	return span;
}

// Measure the pixel width of a text string when rendered in monospace font
export function measureText(text: string, span: HTMLSpanElement): number {
	span.textContent = text;
	return span.getBoundingClientRect().width;
}

export function calculateReadableWidth(pre: HTMLElement, span: HTMLSpanElement): number {
	const containerWidth = pre.getBoundingClientRect().width;
	
	if (containerWidth > 0) {
		// Measure actual space character width in current font
		span.textContent = ' ';
		const actualCharWidth = span.getBoundingClientRect().width;
		const charsAvailable = Math.floor(containerWidth / actualCharWidth);
		return charsAvailable - BORDER_OVERHEAD;
	}
	
	// Fallback when container width is not yet available
	return FALLBACK_WIDTH - BORDER_OVERHEAD;
}
