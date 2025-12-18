import { BorderConfig } from './utils/types';
import { createBorder } from './borderProcessor';
import { calculateReadableWidth, measureText } from './utils/measurements';
import { App, MarkdownPostProcessorContext, MarkdownView } from 'obsidian';

export function renderBorder(source: string, el: HTMLElement, config: BorderConfig, app: App, ctx: MarkdownPostProcessorContext): void {
    const container = el.createDiv({ cls: 'ascii-border-container' });

    const pre = container.createEl('pre', { cls: 'ascii-border-content' });

    const measureSpan = container.createEl('span', {
        cls: 'ascii-border-measure-span'
    });

    let scheduled = false;

    const render = () => {
        const targetWidth = calculateReadableWidth(pre, measureSpan);
        const bordered = createBorder(
            source,
            config.style,
            (text) => {
                measureSpan.textContent = text;
                return measureSpan.getBoundingClientRect().width;
            },
            targetWidth,
            config.centerText
        );
        pre.textContent = bordered;
    };

    const scheduleRender = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            render();
        });
    };

    scheduleRender();

    const resizeObserver = new ResizeObserver(() => {
        if (!container.isConnected) {
            resizeObserver.disconnect();
            return;
        }
        scheduleRender();
    });

    resizeObserver.observe(container);

    // Click anywhere to edit
    pre.addEventListener('click', async () => {
        const sectionInfo = ctx.getSectionInfo(container);
        if (!sectionInfo) return;

        const view = app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;

        if (view.getMode() === 'preview') {
            await view.setState({ mode: 'source' }, {
                history: false
            });
        }

        const lastLine = view.editor.getLine(sectionInfo.lineEnd);
        // position cursor on the last line, before the closing back ticks
        view.editor.setCursor({ line: sectionInfo.lineEnd, ch: lastLine.length - 3 });
        view.editor.focus();
    });
}
