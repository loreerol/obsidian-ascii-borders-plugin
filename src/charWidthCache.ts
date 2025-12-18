const charWidthCache = new Map<string, number>();

export function getMonospaceCharWidth(
    container: HTMLElement,
    measureSpan: HTMLSpanElement
): number {
    const styles = getComputedStyle(container);

    const key = [
        styles.fontFamily,
        styles.fontSize,
        styles.lineHeight
    ].join('|');

    const cached = charWidthCache.get(key);
    if (cached !== undefined) {
        return cached;
    }

    // Measure once
    measureSpan.textContent = ' ';
    const width = measureSpan.getBoundingClientRect().width || 1;

    charWidthCache.set(key, width);
    return width;
}