import { BorderConfig } from './utils/types';
import { createBorder } from './borderProcessor';
import { createMeasureSpan, calculateReadableWidth, measureText } from './utils/measurements';
import { MarkdownView } from 'obsidian';

export function renderBorder(source: string, el: HTMLElement, config: BorderConfig, app: any, ctx: any): void {
    const pre = el.createEl('pre', { cls: 'ascii-border-content' });

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

    // Click anywhere to edit
    pre.addEventListener('click', async (e) => {
        const sectionInfo = ctx.getSectionInfo(pre);
        if (!sectionInfo) return;

        const view = app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;

        if (view.getMode() === 'preview') {
            await view.setState({ mode: 'source' }, {});
        }

        const lastLine = view.editor.getLine(sectionInfo.lineEnd);

        // position curson on the last line, before the closing back ticks
        view.editor.setCursor({ line: sectionInfo.lineEnd, ch: (lastLine.length - 3) });
        view.editor.focus();
    });
}
