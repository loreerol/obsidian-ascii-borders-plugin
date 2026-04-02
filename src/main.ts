import { Plugin } from 'obsidian';
import { SettingsTab } from './SettingsTab';
import { DEFAULT_SETTINGS } from './settings';
import { AsciiBordersSettings } from './utils/types';
import { renderBorder } from 'src/renderer';

export default class AsciiBorders extends Plugin {
  settings: AsciiBordersSettings;

  async onload() {
    await this.loadSettings();

    // Resister all border code block processors
    Object.keys(this.settings.borders).forEach((borderName) => {
      this.registerMarkdownCodeBlockProcessor(`border-${borderName}`, (source, el, ctx) => {
        renderBorder(source, el, this.settings.borders[borderName], this.app, ctx);
      });
    });

    this.addSettingTab(new SettingsTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    try {
      const data = await this.loadData();
      this.settings = Object.assign({}, DEFAULT_SETTINGS, data || {});
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
      this.settings = Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  async saveSettings() {
    try {
      await this.saveData(this.settings);
      this.app.workspace.trigger('markdown-preview-refresh');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }
}
