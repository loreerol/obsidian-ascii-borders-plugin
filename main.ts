import { Plugin } from 'obsidian';
import { SettingsTab } from './src/SettingsTab';
import { DEFAULT_SETTINGS } from './src/settings';
import { AsciiBordersSettings } from './src/utils/types';
import { renderBorder } from 'src/renderer';

export default class AsciiBorders extends Plugin {
	settings: AsciiBordersSettings;

	async onload() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		
		// Resister all border code block processors
		Object.keys(this.settings.borders).forEach((borderName) => {
			this.registerMarkdownCodeBlockProcessor(`border-${borderName}`, (source, el) => {
				renderBorder(source, el, this.settings.borders[borderName]);
			});
		});

		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload() {}

	async saveSettings() {
		await this.saveData(this.settings);
	}	
}
