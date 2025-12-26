import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type AsciiBorders from './main';
import { BorderConfig, BorderStyle } from './utils/types';

export class SettingsTab extends PluginSettingTab {
	plugin: AsciiBorders;
	private updateTimeouts: Map<string, NodeJS.Timeout>;

	constructor(app: App, plugin: AsciiBorders) {
		super(app, plugin);
		this.plugin = plugin;
		this.updateTimeouts = new Map();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Border Configuration')
			.setHeading();

		this.addNewBorderButton(containerEl);

		Object.entries(this.plugin.settings.borders).forEach(([key, config]) => {
			this.renderBorderSettings(containerEl, key, config);
		});
	}

	private async saveAndRefresh(): Promise<void> {
		await this.plugin.saveSettings();
		
		// Dispatch custom event to all border containers
		const borderContainers = document.querySelectorAll('.ascii-border-container');
		borderContainers.forEach(container => {
			container.dispatchEvent(new Event('ascii-border-update'));
		});
	}

	private debouncedSaveAndRefresh(key: string, delay = 500): void {
		// Clear existing timeout for this key
		const existingTimeout = this.updateTimeouts.get(key);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}

		// Set new timeout
		const timeoutId = setTimeout(async () => {
			await this.saveAndRefresh();
			this.updateTimeouts.delete(key);
		}, delay);

		this.updateTimeouts.set(key, timeoutId);
	}

	private addNewBorderButton(container: HTMLElement): void {
		new Setting(container)
			.addButton(btn => btn
				.setButtonText('Add Border')
				.setCta()
				.onClick(() => this.addBorder()))
	}

	private async addBorder(): Promise<void> {
		const key = this.generateUniqueBorderName();
		const newBorder = this.createDefaultBorder();

		// Add new border at the top
		this.plugin.settings.borders = {
			[key]: newBorder,
			...this.plugin.settings.borders
		};

		await this.saveAndRefresh();
		this.display();
	}

	private generateUniqueBorderName(): string {
		let counter = 1;
		let key = 'custom';
		while (this.plugin.settings.borders[key]) {
			key = `custom-${counter++}`;
		}
		return key;
	}

	private createDefaultBorder(): BorderConfig {
		return {
			style: {
				top: '═',
				bottom: '═',
				left: '║',
				right: '║',
				topLeft: '╔',
				topRight: '╗',
				bottomLeft: '╚',
				bottomRight: '╝'
			},
			centerText: false
		};
	}

	private renderBorderSettings(container: HTMLElement, key: string, config: BorderConfig): void {
		const borderContainer = container.createDiv({ cls: 'border-setting-container' });

		new Setting(borderContainer)
			.setName(`border-${key}`)
			.setHeading();

		this.addBorderName(borderContainer, key);
		this.addBorderStyleSettings(borderContainer, key, config);
	}

	private addBorderName(container: HTMLElement, key: string): void {
		new Setting(container)
			.setName('Border name')
			.setDesc('Used in markdown as: ```border-<name>')
			.addText(text => {
				text.setValue(key);
				text.inputEl.addEventListener('blur', () => {
					this.renameBorder(key, text.getValue());
				});
			});
	}

	private async renameBorder(oldKey: string, newName: string): Promise<void> {
		const newKey = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

		if (!newKey || newKey === oldKey) return;


		if (this.plugin.settings.borders[newKey]) {
			new Notice(`A border with the name "${newKey}" already exists.`);
			return;
		}

		// Preserve order of borders
		const newBorders: Record<string, BorderConfig> = {};
		for (const [key, config] of Object.entries(this.plugin.settings.borders)) {
			if (key === oldKey) {
				newBorders[newKey] = config;
			} else {
				newBorders[key] = config;
			}
		}

		this.plugin.settings.borders = newBorders;
		await this.saveAndRefresh();
		this.display();
	}

	private async deleteBorder(key: string): Promise<void> {
		delete this.plugin.settings.borders[key];
		await this.saveAndRefresh();
		this.display();
	}

	private addBorderStyleSettings(container: HTMLElement, key: string, config: BorderConfig): void {
		const border = config.style;
		
		const update = (part: keyof BorderStyle, value: string) => {
			// Update immediately in memory
			border[part] = value;
			
			// Debounce the save and refresh
			this.debouncedSaveAndRefresh(`${key}-${part}`);
		};

		new Setting(container)
			.setName('Border Top')
			.setDesc('Pattern that repeats horizontally (e.g., "═" or "══✧══")')
			.addText(text => text
				.setValue(border.top)
				.onChange(value => update('top', value)));

		new Setting(container)
			.setName('Border Bottom')
			.setDesc('Pattern that repeats horizontally')
			.addText(text => text
				.setValue(border.bottom)
				.onChange(value => update('bottom', value)));

		new Setting(container)
			.setName('Sides')
			.setDesc('Left and right border characters')
			.addText(text => text
				.setValue(border.left)
				.setPlaceholder('Left')
				.onChange(value => update('left', value)))
			.addText(text => text
				.setValue(border.right)
				.setPlaceholder('Right')
				.onChange(value => update('right', value)));

		new Setting(container)
			.setName('Top Corners')
			.setDesc('Top-left and top-right corner characters')
			.addText(text => text
				.setValue(border.topLeft)
				.setPlaceholder('Left')
				.onChange(value => update('topLeft', value)))
			.addText(text => text
				.setValue(border.topRight)
				.setPlaceholder('Right')
				.onChange(value => update('topRight', value)));

		new Setting(container)
			.setName('Bottom Corners')
			.setDesc('Bottom-left and bottom-right corner characters')
			.addText(text => text
				.setValue(border.bottomLeft)
				.setPlaceholder('Left')
				.onChange(value => update('bottomLeft', value)))
			.addText(text => text
				.setValue(border.bottomRight)
				.setPlaceholder('Right')
				.onChange(value => update('bottomRight', value)));

		new Setting(container)
			.setName('Center text')
			.setClass('border-style-footer')
			.addToggle(toggle => toggle
				.setValue(config.centerText)
				.onChange(async (value) => {
					config.centerText = value;
					await this.saveAndRefresh();
				}))
			.addButton(btn => btn
				.setButtonText('Delete')
				.setWarning()
				.onClick(() => this.deleteBorder(key)));
	}
}

