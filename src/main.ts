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
				renderBorder(
					source, 
					el, 
					this.settings.borders[borderName],
					this.app,
					ctx
				);
			});
		});

		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() || {});
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}	
}
