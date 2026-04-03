# ASCII Borders for Obsidian

When writing notes on paper as a student I would draw borders around sections of text in my notes. 
Perhaps you did as well!
Sometimes different borders were used to convey semantic meaning, such as double lines around important information, and squiggles around side thoughts. 

If class was particularly boring, my borders might start incorporating doodles and elaborate designs.

I still take a lot of notes. Well organized notes with a lot of important information. 
Ugly plain notes. 

This plugin is the cure for bland notes that spark no joy.

## Features

- ASCII art borders around text using code blocks
- 6 pre-built border styles: double, single, rounded, heart, ocean, snail
- Customizable borders via settings UI
- Add, rename, and delete custom borders
- Live preview of borders in settings
- Text centering option
- Auto-resize borders to container width
- Click anywhere within border while in editing view to edit contents
- Support for wide characters and complex Unicode (including Egyptian hieroglyphs)
- Character width caching for performance
- Mobile device support

## Usage

Create a code block with `border-` followed by the style name:

````markdown
```border-heart
Your text here
```
````
Click outside of the code block to see the border.
Click the code block to go back to content editing mode. 

## Settings

Customize each border style in the plugin settings:

- Edit border characters (top, bottom, left, right, corners)
- Toggle text centering on/off
- Rename borders (changes the code block name)
- Delete borders

## Installation

### From Obsidian Community Plugins - Not yet available

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder named `ascii_borders` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into the folder
4. Reload Obsidian and enable the plugin in Settings → Community Plugins

### Development Installation

1. Clone this repo in your vault's `.obsidian/plugins/` directory
2. Run `npm install` to install dependencies
3. Run `npm run dev` for development with auto-rebuild
4. Run `npm run build` for production build
5. Reload Obsidian and enable the plugin in Settings → Community Plugins

6. After each rebuild you will need to reload Obsidian to see the changes

Note: I recommend you create a new vault to test changes to the plugin so that your changes do not risk corrupting your main vault

### Troubleshooting
Check that you don't have unintentional white space if your border is not rendering as expected

Deleted or renamed borders will still work until after obsidian has been reloaded

If something looks funky try a reload Press `Ctrl/Cmd+P`, type `Reload`, and select `Reload app without saving`

Sometimes borders don't line up with their side perfectly. This is because measuring characters is hard and I tried my best. Try adding additional characters until it looks good enough

You are more then welcome to report any problems by creating an issue. If you do please check obsidians console to see if there are any helpful messages you can see the console by

I will try and get to any issues as fast as I can, or if you code, feel free to open a PR

### Contributing 

