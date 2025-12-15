import { BorderConfig } from './utils/types';
import { createBorder } from './borderProcessor';
import { createMeasureSpan, calculateReadableWidth, measureText } from './utils/measurements';

export function renderBorder(source: string, el: HTMLElement, config: BorderConfig): void {
    const pre = el.createEl('pre');
    pre.style.whiteSpace = 'pre';
    pre.style.fontFamily = 'monospace';
    pre.style.lineHeight = '1.2';
    
    const measureSpan = createMeasureSpan(pre);
    
    // Wait for the pre element to exist before measuring and rendering
    requestAnimationFrame(() => {
        const targetWidth = calculateReadableWidth(pre, measureSpan);
        const bordered = createBorder(
            source.trim(),
            config.style,
            (text) => measureText(text, measureSpan),
            targetWidth,
            config.centerText
        );
        pre.textContent = bordered;
    });
}
