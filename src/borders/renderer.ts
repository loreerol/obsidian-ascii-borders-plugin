import { BorderConfig } from '../utils/types';
import { createBorder } from './processor';
import { calculateReadableWidth } from '../utils/math';
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
    cls: 'ascii-border-measure-span',
  });

  let scheduled = false;
  let resizeObserver: ResizeObserver | null = null;

  const render = () => {
    try {
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
    } catch (error) {
      pre.textContent = 'Error rendering border';
      console.error('Failed to render border:', error);
    }
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

  // Click anywhere to edit (only in preview/source mode, not reading mode)
  const clickHandler = async () => {
    const sectionInfo = ctx.getSectionInfo(container);
    if (!sectionInfo) return;

    const view = app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    // Check if in reading mode - don't allow editing
    const viewState = view.leaf.getViewState();
    if (viewState.state?.mode === 'preview' && viewState.state?.source === false) {
      return;
    }

    if (view.getMode() === 'preview') {
      await view.setState(
        { mode: 'source' },
        {
          history: false,
        }
      );
    }

    const lastLine = view.editor.getLine(sectionInfo.lineEnd);
    // position cursor on the last line, before the closing back ticks
    view.editor.setCursor({
      line: sectionInfo.lineEnd,
      ch: lastLine.length - 3,
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
