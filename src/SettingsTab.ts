import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type AsciiBorders from '../main';
import { BorderConfig } from './utils/types';

export class SettingsTab extends PluginSettingTab {
	plugin: AsciiBorders;

	constructor(app: App, plugin: AsciiBorders) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Border configuration')
			.setHeading();

		Object.entries(this.plugin.settings.borders).forEach(([key, config]) => {
			this.renderBorderSettings(containerEl, key, config);
		});
	}

	private renderBorderSettings(container: HTMLElement, key: string, config: BorderConfig): void {
		const borderContainer = container.createDiv({ cls: 'border-setting-container' });
		
		new Setting(borderContainer)
			.setName(`border-${key}`)
			.setHeading();

		this.addBorderName(borderContainer, key);
		this.addBorderStyleSettings(borderContainer, config);
	}

	private addBorderName(container: HTMLElement, key: string): void {
		new Setting(container)
			.setName('Border name')
			.setDesc('Used in markdown as: ```border-<name>')
			.addText(text => 
				text
					.setValue(key)
					.onChange(async (value) => {
						await this.renameBorder(key, value);
					})
			);
	}

	private async renameBorder(oldKey: string, newKey: string): Promise<void> {
		if (oldKey === newKey) return;

		const formatedNewKey = newKey.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

		if (this.plugin.settings.borders[formatedNewKey]) {
			new Notice(`A border with the name "${formatedNewKey}" already exists.`);
			return;
		}

		this.plugin.settings.borders[formatedNewKey] = this.plugin.settings.borders[oldKey];
		delete this.plugin.settings.borders[oldKey];

		await this.plugin.saveSettings();
		this.display();
	}

	private toggleCenterText(container: HTMLElement, config: BorderConfig): void {
		new Setting(container)
			.setName('Center text')
			.setDesc('Do you want the text centered within the border')
			.addToggle(toggle =>
				toggle.setValue(config.centerText).onChange(async (value) => {
					config.centerText = value;
					await this.plugin.saveSettings();
				})
			);
	}

	private addBorderStyleSettings(container: HTMLElement, config: BorderConfig): void {
		const border = config.style;
		const update = async (part: keyof typeof border, value: string) => {
			border[part] = value;
			await this.plugin.saveSettings();
		};

		new Setting(container)
			.setName('Top border')
			.addText(text => text.setValue(border.top).onChange(value => update('top', value)));

		new Setting(container)
			.setName('Bottom border')
			.addText(text => text.setValue(border.bottom).onChange(value => update('bottom', value)));

		new Setting(container)
			.setName('Left border')
			.addText(text => text.setValue(border.left).onChange(value => update('left', value)));

		new Setting(container)
			.setName('Right border')
			.addText(text => text.setValue(border.right).onChange(value => update('right', value)));

		new Setting(container)
			.setName('Top Left corner')
			.addText(text => text.setValue(border.topLeft).onChange(value => update('topLeft', value)));

		new Setting(container)
			.setName('Top Right corner')
			.addText(text => text.setValue(border.topRight).onChange(value => update('topRight', value)));

		new Setting(container)
			.setName('Bottom Left corner')
			.addText(text => text.setValue(border.bottomLeft).onChange(value => update('bottomLeft', value)));

		new Setting(container)
			.setName('Bottom Right corner')
			.addText(text => text.setValue(border.bottomRight).onChange(value => update('bottomRight', value)));

		this.toggleCenterText(container, config);
	}
}

