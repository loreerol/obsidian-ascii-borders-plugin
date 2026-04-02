export class Plugin {
  app: any;
  manifest: any;

  constructor(app: any, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }

  loadData(): Promise<any> {
    return Promise.resolve({});
  }

  saveData(data: any): Promise<void> {
    return Promise.resolve();
  }

  registerMarkdownCodeBlockProcessor(language: string, handler: Function): void {}

  addSettingTab(tab: any): void {}
}

export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: any;

  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = {
      empty: jest.fn(),
      createDiv: jest.fn(),
      createEl: jest.fn(),
      querySelector: jest.fn()
    };
  }

  display(): void {}
  hide(): void {}
}

export class Setting {
  private nameEl: string = '';
  private descEl: string = '';
  private buttons: any[] = [];
  private texts: any[] = [];
  private toggles: any[] = [];

  constructor(containerEl: any) {}

  setName(name: string): this {
    this.nameEl = name;
    return this;
  }

  setDesc(desc: string): this {
    this.descEl = desc;
    return this;
  }

  setHeading(): this {
    return this;
  }

  setClass(cls: string): this {
    return this;
  }

  addButton(cb: (button: any) => any): this {
    const button = {
      setButtonText: jest.fn().mockReturnThis(),
      setCta: jest.fn().mockReturnThis(),
      setWarning: jest.fn().mockReturnThis(),
      onClick: jest.fn(function(this: any, handler: any) {
        this._clickHandler = handler;
        return this;
      })
    };
    cb(button);
    this.buttons.push(button);
    return this;
  }

  addText(cb: (text: any) => any): this {
    const text = {
      setValue: jest.fn().mockReturnThis(),
      getValue: jest.fn(() => ''),
      setPlaceholder: jest.fn().mockReturnThis(),
      onChange: jest.fn(function(this: any, handler: any) {
        this._changeHandler = handler;
        return this;
      }),
      inputEl: {
        addEventListener: jest.fn()
      }
    };
    cb(text);
    this.texts.push(text);
    return this;
  }

  addToggle(cb: (toggle: any) => any): this {
    const toggle = {
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn(function(this: any, handler: any) {
        this._changeHandler = handler;
        return this;
      })
    };
    cb(toggle);
    this.toggles.push(toggle);
    return this;
  }
}

export class Notice {
  constructor(message: string) {
    // Mock notice
  }
}

export class MarkdownRenderChild {
  containerEl: HTMLElement;
  onunload?: () => void;

  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
  }
}

export class MarkdownView {
  leaf: any;
  editor: any;

  getMode(): string {
    return 'preview';
  }

  setState(state: any, options?: any): Promise<void> {
    return Promise.resolve();
  }
}

export interface App {
  workspace: any;
}

export interface MarkdownPostProcessorContext {
  getSectionInfo(el: HTMLElement): any;
  addChild(child: MarkdownRenderChild): void;
}
