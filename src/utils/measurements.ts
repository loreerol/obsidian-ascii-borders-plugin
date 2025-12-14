import { 
	BORDER_OVERHEAD, 
	SAFETY_MARGIN_PERCENT, 
	FALLBACK_WIDTH 
} from './constrants';

// Create a hidden span element for measuring text width in pixels
export function createMeasureSpan(element: HTMLElement): HTMLSpanElement {
	const span = element.ownerDocument.createElement('span');
	span.style.cssText = 'visibility:hidden;position:absolute;white-space:pre;font-family:monospace';
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
		const overhead = BORDER_OVERHEAD + Math.floor(charsAvailable * SAFETY_MARGIN_PERCENT);
		return charsAvailable - overhead;
	}
	
	// Fallback when container width is not yet available
	const overhead = BORDER_OVERHEAD + Math.floor(FALLBACK_WIDTH * SAFETY_MARGIN_PERCENT);
	return FALLBACK_WIDTH - overhead;
}
