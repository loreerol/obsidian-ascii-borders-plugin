
import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type AsciiBorders from '../main';
import { BorderStyle } from 'src/utils/types';

export class SettingsTab extends PluginSettingTab {
	plugin: AsciiBorders;

	constructor(app: App, plugin: AsciiBorders) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Border Configuration' });

		Object.entries(this.plugin.settings.borders).forEach(([key, border]) => {
			console.log(`Rendering settings for border: ${key} ${border} `);
			this.renderBorderSettings(containerEl, key, border);
		})
	}

	private renderBorderSettings(container: HTMLElement, key: string, border: any): void {
		const borderContainer = container.createDiv({ cls: 'border-setting-container' });
		borderContainer.createEl('h3', { text: `border-${key}` });

		this.addBorderName(container, key);
		this.updateBorderStyle(container, border);
	};

	private addBorderName(container: HTMLElement, key: string): void {
		new Setting(container)
			.setName('Border name')
			.setDesc('Used in markdown as: ```border-<name>')
			.addText(text => {
				text
					.setValue(key)
					.inputEl.addEventListener('blur', () => this.renameBorder(key, text.getValue()));
			});
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

	private updateBorderStyle(container: HTMLElement, border: BorderStyle): void {
		const update = async (part: keyof BorderStyle, value: string) => {
			border[part] = value;
			await this.plugin.saveData(this.plugin.settings);
		}

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
	}
}