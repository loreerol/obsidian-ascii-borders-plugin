import { Plugin } from 'obsidian';
import { SettingsTab } from './settingsTab';
import { DEFAULT_BORDERS } from './utils/defaults';
import { DefaultBorders } from './utils/types';
import { BorderProcessorRegistry } from './borderProcessorRegistry';

export default class AsciiBorders extends Plugin {
  settings!: DefaultBorders;
  private borderRegistry!: BorderProcessorRegistry;

  async onload() {
    await this.loadSettings();
    this.borderRegistry = new BorderProcessorRegistry(this, this.app);
    this.borderRegistry.registerBorderProcessors(this.settings);
    this.addSettingTab(new SettingsTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    try {
      const data = await this.loadData();
      this.settings = Object.assign({}, DEFAULT_BORDERS, data || {});
    } catch (error) {
      console.error('Failed to load settings, using defaults:', error);
      this.settings = Object.assign({}, DEFAULT_BORDERS);
    }
  }

  async saveSettings() {
    try {
      await this.saveData(this.settings);
      this.borderRegistry.registerBorderProcessors(this.settings);
      this.app.workspace.trigger('markdown-preview-refresh');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }
}
