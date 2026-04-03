import type { App, Plugin } from 'obsidian';
import type { DefaultBorders } from './utils/types';
import { renderBorder } from './borders/renderer';

export class BorderProcessorRegistry {
  private registeredBorders: Set<string> = new Set();
  private plugin: Plugin;
  private app: App;

  constructor(plugin: Plugin, app: App) {
    this.plugin = plugin;
    this.app = app;
  }

  registerBorderProcessors(settings: DefaultBorders): void {
    Object.keys(settings.borders).forEach((borderName) => {
      if (!this.registeredBorders.has(borderName)) {
        this.plugin.registerMarkdownCodeBlockProcessor(
          `border-${borderName}`,
          (source, el, ctx) => {
            renderBorder(source, el, settings.borders[borderName], this.app, ctx);
          }
        );
        this.registeredBorders.add(borderName);
      }
    });
  }

  hasRegistered(borderName: string): boolean {
    return this.registeredBorders.has(borderName);
  }

  getRegisteredCount(): number {
    return this.registeredBorders.size;
  }
}
