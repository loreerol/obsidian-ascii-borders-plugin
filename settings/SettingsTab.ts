
import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type AsciiBorders from '../main';

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
		this.addBorderName(container, key)
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
}