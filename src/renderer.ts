import { BorderConfig } from './utils/types';
import { createBorder } from './borderProcessor';
import { calculateReadableWidth } from './utils/measurements';
import { App, MarkdownPostProcessorContext, MarkdownView, MarkdownRenderChild } from 'obsidian';

export function renderBorder(
    source: string, 
    el: HTMLElement, 
    config: BorderConfig, 
    app: App, 
    ctx: MarkdownPostProcessorContext
): void {
    const container = el.createDiv({ cls: 'ascii-border-container' });

    const pre = container.createEl('pre', { cls: 'ascii-border-content' });

    const measureSpan = container.createEl('span', {
        cls: 'ascii-border-measure-span'
    });

    let scheduled = false;
    let resizeObserver: ResizeObserver | null = null;

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

    resizeObserver = new ResizeObserver(() => {
        if (!container.isConnected) {
            resizeObserver?.disconnect();
            resizeObserver = null;
            return;
        }
        scheduleRender();
    });

    resizeObserver.observe(container);

    // Listen for settings updates
    const settingsUpdateHandler = () => {
        scheduleRender();
    };
    
    // Trigger re-renders
    container.addEventListener('ascii-border-update', settingsUpdateHandler);

    // Click anywhere to edit
    const clickHandler = async () => {
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
        view.editor.setCursor({ 
            line: sectionInfo.lineEnd, 
            ch: lastLine.length - 3 
        });
        view.editor.focus();
    };
    
    pre.addEventListener('click', clickHandler);

    // Proper cleanup using MarkdownRenderChild
    const cleanup = new MarkdownRenderChild(container);
    cleanup.onunload = () => {
        resizeObserver?.disconnect();
        resizeObserver = null;
        pre.removeEventListener('click', clickHandler);
        container.removeEventListener('ascii-border-update', settingsUpdateHandler);
    };
    
    ctx.addChild(cleanup);
}
