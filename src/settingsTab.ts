import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type AsciiBorders from './main';
import { BorderConfig, BorderStyle } from './utils/types';
import { createBorder } from './borderProcessor';
import { calculateReadableWidth } from './utils/math';
import { DEFAULT_BORDER_STYLES, INSTRUCTIONS_BORDER_STYLE } from './utils/defaults';

export class SettingsTab extends PluginSettingTab {
  plugin: AsciiBorders;
  private debounceTimeouts: Map<string, NodeJS.Timeout>;

  constructor(app: App, plugin: AsciiBorders) {
    super(app, plugin);
    this.plugin = plugin;
    this.debounceTimeouts = new Map();
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName('Border Configuration').setHeading();

    this.addInstructions(containerEl);

    this.addNewBorderButton(containerEl);

    Object.entries(this.plugin.settings.borders).forEach(([key, config]) => {
      this.renderBorderSettings(containerEl, key, config);
    });
  }

  private async save(opts: { debounceKey?: string } = {}): Promise<void> {
    const doSave = async () => {
      await this.plugin.saveSettings();
      document.querySelectorAll('.ascii-border-container').forEach((container) => {
        container.dispatchEvent(new Event('ascii-border-update'));
      });
    };

    if (opts.debounceKey) {
      const existing = this.debounceTimeouts.get(opts.debounceKey);
      if (existing) clearTimeout(existing);
      const id = setTimeout(async () => {
        await doSave();
        this.debounceTimeouts.delete(opts.debounceKey!);
      }, 500);
      this.debounceTimeouts.set(opts.debounceKey, id);
    } else {
      await doSave();
    }
  }

  private createPreElement(
    container: HTMLElement,
    cls: string
  ): { pre: HTMLElement; measureSpan: HTMLElement } {
    const pre = container.createEl('pre', { cls });
    const measureSpan = pre.createEl('span', { cls: 'ascii-border-measure-span' });
    return { pre, measureSpan };
  }

  private addInstructions(container: HTMLElement): void {
    const style = INSTRUCTIONS_BORDER_STYLE;
    const { pre: previewContainer, measureSpan: previewMeasureSpan } = this.createPreElement(
      container,
      'border-preview'
    );

    const content = [
      'Hit Copy Code Block on any border below, paste into a note,',
      'and type between the fences:',
      '',
      '  ```border-custom',
      '  Your text here',
      '  ```',
      '',
      'Customisation',
      '',
      '  Top & Bottom - repeating pattern (e.g. ══✧══), blank spaces are allowed',
      '  Sides & Corners - single characters only, blank spaces are allowed',
      '  Center text - toggles horizontal centering',
      '',
      'Click inside a border in reading view to edit its content.',
    ].join('\n');

    const render = () => {
      const targetWidth = calculateReadableWidth(previewContainer, previewMeasureSpan);
      previewContainer.textContent = createBorder(
        content,
        style,
        (text) => {
          previewMeasureSpan.textContent = text;
          return previewMeasureSpan.getBoundingClientRect().width;
        },
        targetWidth,
        false
      );
    };

    setTimeout(render, 0);
  }

  private addNewBorderButton(container: HTMLElement): void {
    new Setting(container).setClass('add-border-button').addButton((btn) =>
      btn
        .setButtonText('➕ Create Custom Border 🎨')
        .setCta()
        .onClick(() => this.addBorder())
    );
  }

  private async addBorder(): Promise<void> {
    const key = this.generateUniqueBorderName();
    this.plugin.settings.borders = {
      [key]: this.createDefaultBorder(),
      ...this.plugin.settings.borders,
    };
    await this.save();
    this.display();
  }

  private async renameBorder(oldKey: string, newName: string): Promise<void> {
    const newKey = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!newKey || newKey === oldKey) return;

    if (this.plugin.settings.borders[newKey]) {
      new Notice(`A border with the name "${newKey}" already exists.`);
      return;
    }

    const newBorders: Record<string, BorderConfig> = {};
    for (const [key, config] of Object.entries(this.plugin.settings.borders)) {
      newBorders[key === oldKey ? newKey : key] = config;
    }

    this.plugin.settings.borders = newBorders;
    await this.save();
    this.display();
  }

  private async deleteBorder(key: string): Promise<void> {
    delete this.plugin.settings.borders[key];
    await this.save();
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
      style: DEFAULT_BORDER_STYLES.double,
      centerText: false,
    };
  }

  private renderBorderSettings(container: HTMLElement, key: string, config: BorderConfig): void {
    const borderContainer = container.createDiv({ cls: 'border-setting-container' });

    this.addBorderHeader(borderContainer, key);
    const updatePreview = this.addBorderPreview(borderContainer, config);
    this.addBorderName(borderContainer, key);
    this.addBorderStyleSettings(borderContainer, key, config, updatePreview);
  }

  private addBorderHeader(container: HTMLElement, key: string): void {
    new Setting(container)
      .setName(`border-${key}`)
      .setHeading()
      .addButton((btn) =>
        btn
          .setButtonText(`Copy Code Block`)
          .setCta()
          .setTooltip('Copy code block to clipboard')
          .onClick(() => {
            navigator.clipboard.writeText(`\`\`\`border-${key}\n\n\`\`\``).then(() => {
              btn.setButtonText('Copied!');
              setTimeout(() => btn.setButtonText(`Copy Code Block`), 1500);
            });
          })
      );
  }

  private addBorderPreview(container: HTMLElement, config: BorderConfig): () => void {
    const { pre: previewContainer, measureSpan: previewMeasureSpan } = this.createPreElement(
      container,
      'border-preview'
    );

    const updatePreview = () => {
      try {
        const targetWidth = calculateReadableWidth(previewContainer, previewMeasureSpan);
        previewContainer.textContent = createBorder(
          'Sample Text',
          config.style,
          (text) => {
            previewMeasureSpan.textContent = text;
            return previewMeasureSpan.getBoundingClientRect().width;
          },
          targetWidth,
          config.centerText
        );
        previewContainer.appendChild(previewMeasureSpan); // ← re-attach after textContent wipes it
      } catch (error) {
        previewContainer.textContent = 'Error rendering preview';
        previewContainer.appendChild(previewMeasureSpan);
        console.error('Error rendering preview:', error);
      }
    };

    // Delay to ensure container has width
    setTimeout(updatePreview, 0);

    return updatePreview;
  }

  private addBorderName(container: HTMLElement, key: string): void {
    new Setting(container)
      .setName('Border name')
      .setDesc('Used in markdown as: ```border-<name>')
      .addText((text) => {
        text.setValue(key);
        text.inputEl.addEventListener('blur', () => {
          this.renameBorder(key, text.getValue());
        });
      });
  }

  private addBorderStyleSettings(
    container: HTMLElement,
    key: string,
    config: BorderConfig,
    updatePreview: () => void
  ): void {
    const border = config.style;
    const firstChar = (str: string): string => [...str][0] || '';

    const update = (part: keyof BorderStyle, value: string) => {
      border[part] = value;
      updatePreview();
      this.save({ debounceKey: `${key}-${part}` });
    };

    new Setting(container)
      .setName('Border Top')
      .setDesc('Pattern that repeats horizontally (e.g., "═" or "══✧══")')
      .addText((text) => text.setValue(border.top).onChange((value) => update('top', value)));

    new Setting(container)
      .setName('Border Bottom')
      .setDesc('Pattern that repeats horizontally')
      .addText((text) => text.setValue(border.bottom).onChange((value) => update('bottom', value)));

    new Setting(container)
      .setName('Sides')
      .setDesc('Left and right border characters (single character only)')
      .addText((text) =>
        text
          .setValue(border.left)
          .setPlaceholder('Left')
          .onChange((value) => update('left', firstChar(value)))
      )
      .addText((text) =>
        text
          .setValue(border.right)
          .setPlaceholder('Right')
          .onChange((value) => update('right', firstChar(value)))
      );

    new Setting(container)
      .setName('Top Corners')
      .setDesc('Top-left and top-right corner characters (single character only)')
      .addText((text) =>
        text
          .setValue(border.topLeft)
          .setPlaceholder('Left')
          .onChange((value) => update('topLeft', firstChar(value)))
      )
      .addText((text) =>
        text
          .setValue(border.topRight)
          .setPlaceholder('Right')
          .onChange((value) => update('topRight', firstChar(value)))
      );

    new Setting(container)
      .setName('Bottom Corners')
      .setDesc('Bottom-left and bottom-right corner characters (single character only)')
      .addText((text) =>
        text
          .setValue(border.bottomLeft)
          .setPlaceholder('Left')
          .onChange((value) => update('bottomLeft', firstChar(value)))
      )
      .addText((text) =>
        text
          .setValue(border.bottomRight)
          .setPlaceholder('Right')
          .onChange((value) => update('bottomRight', firstChar(value)))
      );

    new Setting(container)
      .setName('Center text')
      .setClass('border-style-footer')
      .addToggle((toggle) =>
        toggle.setValue(config.centerText).onChange(async (value) => {
          config.centerText = value;
          updatePreview();
          await this.save();
        })
      )
      .addButton((btn) =>
        btn
          .setButtonText('Delete')
          .setWarning()
          .onClick(() => this.deleteBorder(key))
      );
  }
}
