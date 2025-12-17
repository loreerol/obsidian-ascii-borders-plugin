# ASCII Borders for Obsidian

Add customizable ASCII borders to your Obsidian notes.

## Features
- A few default border styles
- Customize the borders in the setting tab
- Choose if you would like the text centered or left-aligned per each border
- Works with any unicode characters

## Coming soon features
- Add additional borders
- Delete borders
- Preview borders in settings
- Respect default right alighnment settings
- Click anywhere on the code block to edit (currently you must hover & click the edit icon)

## Usage

Create a code block with `border-` followed by the style name:

````markdown
```border-heart
Your text here
```
````

## Settings

Customize each border style in the plugin settings:
- Edit border characters (top, bottom, left, right, corners)
- Toggle text centering on/off
- Rename borders (changes the code block name)

## Installation

### From Obsidian Community Plugins - Not yet available 

### Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder named `ascii_borders` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into the folder
4. Reload Obsidian and enable the plugin in Settings → Community Plugins

### Development Installation
1. Clone this repo
2. Run `npm install` to install dependencies
3. Run `npm run dev` for development with auto-rebuild
4. Run `npm run build` for production build
