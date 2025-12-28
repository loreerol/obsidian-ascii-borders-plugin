import { BorderStyle } from './utils/types';
import { CONTENT_PADDING } from './utils/constants';
import { wrapLine } from './utils/measurements';

// Center a pattern by filling left with first char and right with last char
function centerPattern(
    pattern: string,
    targetWidth: number,
    measureWidth: (text: string) => number
): string {
    if (!pattern || pattern.length === 0) {
        return '';
    }

    // Egyptian hieroglyphs use surrogate pairs (2 UTF-16 code units), we need to use Array.from() to prevent spliting them incorrectly
    const patternChars = Array.from(pattern);
    
    // Extract fill characters from pattern edges
    const leftChar = patternChars[0];
    const rightChar = patternChars[patternChars.length - 1];

    const leftCharWidth = measureWidth(leftChar);
    const rightCharWidth = measureWidth(rightChar);
    const patternWidth = measureWidth(pattern);
    const availableWidth = targetWidth - patternWidth;

    // Guard against negative or zero widths
    if (availableWidth <= 0 || leftCharWidth <= 0 || rightCharWidth <= 0) {
        return pattern;
    }

    // Calculate how many characters fit on each side
    const leftCount = Math.floor(availableWidth / 2 / leftCharWidth);
    const rightWidth = availableWidth - (leftCount * leftCharWidth);
    const rightCount = Math.max(0, Math.round(rightWidth / rightCharWidth));

    return leftChar.repeat(leftCount) + pattern + rightChar.repeat(rightCount);
}

function wrapTextWithSides(
    lines: string[],
    width: number,
    border: BorderStyle,
    centerText: boolean
): string[] {
    return lines.map(line => {
        const spaces = ' '.repeat(CONTENT_PADDING);
        
        if (centerText) {
            // Center the text with space padding
            const leftPad = Math.floor((width - line.length) / 2);
            const rightPad = width - line.length - leftPad;
            
            return `${border.left}${spaces}${' '.repeat(leftPad)}${line}${' '.repeat(rightPad)}${spaces}${border.right}`;
        } else {
            // Left-align the text
            const rightPad = width - line.length;
            return `${border.left}${spaces}${line}${' '.repeat(rightPad)}${spaces}${border.right}`;
        }
    });
}

export function createBorder(
    text: string,
    border: BorderStyle,
    measureWidth: (text: string) => number,
    targetWidth = 0,
    centerText = false
): string {
    const rawLines = text.split('\n');

    // Wrap lines explicitly
    const lines = rawLines.flatMap(line =>
        wrapLine(line, targetWidth)
    );

    const maxLineLength = Math.max(...lines.map(l => l.length));
    const width = Math.max(targetWidth, maxLineLength);

    // Measure total content area width in pixels for horizontal borders
    const contentAreaWidth = ' '.repeat(CONTENT_PADDING + width + CONTENT_PADDING);
    const contentWidthPx = measureWidth(contentAreaWidth);

    // Build top and bottom borders with centered patterns
    const topBorder = border.topLeft + centerPattern(border.top, contentWidthPx, measureWidth) + border.topRight;
    const bottomBorder = border.bottomLeft + centerPattern(border.bottom, contentWidthPx, measureWidth) + border.bottomRight;

    // Combine all parts
    return [topBorder, ...wrapTextWithSides(lines, width, border, centerText), bottomBorder].join('\n');
}
