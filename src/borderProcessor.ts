import { BorderStyle } from './settings';
import { CONTENT_PADDING } from './utils/constrants';

// Center a pattern by filling left with first char and right with last char
function centerPattern(
    pattern: string,
    targetWidth: number,
    measureWidth: (text: string) => number
): string {
    // Extract fill characters from pattern edges
    const leftChar = pattern[0];
    const rightChar = pattern[pattern.length - 1];

    const leftCharWidth = measureWidth(leftChar);
    const rightCharWidth = measureWidth(rightChar);
    const availableWidth = targetWidth - measureWidth(pattern);

    // Calculate how many characters fit on each side
    const leftCount = Math.floor(availableWidth / 2 / leftCharWidth);
    const rightWidth = availableWidth - (leftCount * leftCharWidth);
    const rightCount = Math.round(rightWidth / rightCharWidth);

    return leftChar.repeat(leftCount) + pattern + rightChar.repeat(rightCount);
}

function wrapTextWithSides(
    lines: string[],
    width: number,
    border: BorderStyle
): string[] {
    return lines.map(line => {
        // Center the text with space padding
        const leftPad = Math.floor((width - line.length) / 2);
        const rightPad = width - line.length - leftPad;
        const spaces = ' '.repeat(CONTENT_PADDING);

        // Build: left border | padding | centered text | padding | right border
        return `${border.left}${spaces}${' '.repeat(leftPad)}${line}${' '.repeat(rightPad)}${spaces}${border.right}`;
    });
}

export function createBorder(
    text: string,
    border: BorderStyle,
    measureWidth: (text: string) => number,
    targetWidth = 0
): string {
    // Determine content width
    const lines = text.split('\n');
    const maxLineLength = Math.max(...lines.map(l => l.length));
    const width = Math.max(targetWidth, maxLineLength);

    // Measure total content area width in pixels for horizontal borders
    const contentAreaWidth = ' '.repeat(CONTENT_PADDING + width + CONTENT_PADDING);
    const contentWidthPx = measureWidth(contentAreaWidth);

    // Build top and bottom borders with centered patterns
    const topBorder = border.topLeft + centerPattern(border.top, contentWidthPx, measureWidth) + border.topRight;
    const bottomBorder = border.bottomLeft + centerPattern(border.bottom, contentWidthPx, measureWidth) + border.bottomRight;

    // Combine all parts
    return [topBorder, ...wrapTextWithSides(lines, width, border), bottomBorder].join('\n');
}
