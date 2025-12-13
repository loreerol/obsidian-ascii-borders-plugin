import { Plugin } from 'obsidian';
import { SettingsTab } from './settings/SettingsTab';
import { DEFAULT_SETTINGS } from './settings/defaultBorders';
import { AsciiBordersSettings } from './types';

export default class AsciiBorders extends Plugin {
	settings: AsciiBordersSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingsTab(this.app, this));

	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
