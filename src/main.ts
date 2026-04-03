import { Plugin } from 'obsidian';
import { SettingsTab } from './settingsTab';
import { DEFAULT_BORDERS } from './utils/defaults';
import { DefaultBorders } from './utils/types';
import { renderBorder } from 'src/renderer';

export default class AsciiBorders extends Plugin {
  settings: DefaultBorders;
  private registeredBorders: Set<string> = new Set();

  async onload() {
    await this.loadSettings();
    this.registerBorderProcessors();
    this.addSettingTab(new SettingsTab(this.app, this));
  }

  private registerBorderProcessors(): void {
    Object.keys(this.settings.borders).forEach((borderName) => {
      if (!this.registeredBorders.has(borderName)) {
        this.registerMarkdownCodeBlockProcessor(`border-${borderName}`, (source, el, ctx) => {
          renderBorder(source, el, this.settings.borders[borderName], this.app, ctx);
        });
        this.registeredBorders.add(borderName);
      }
    });
  }

  onunload() {}

  async loadSettings() {
    try {
      const data = await this.loadData();
      this.settings = Object.assign({}, DEFAULT_BORDERS, data || {});
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
      this.settings = Object.assign({}, DEFAULT_BORDERS);
    }
  }

  async saveSettings() {
    try {
      await this.saveData(this.settings);
      this.registerBorderProcessors();
      this.app.workspace.trigger('markdown-preview-refresh');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }
}
