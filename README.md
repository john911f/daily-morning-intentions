# Daily Morning Intentions - Obsidian Plugin

A mindful way to start your day! This plugin automatically inserts inspiring morning intentions into your daily notes, helping you set a positive tone for each day.

## Features

- **Automatic Daily Note Integration**: Automatically adds intentions when you create new daily notes
- **Cursor Insertion**: Insert intentions anywhere with a simple command and hotkey
- **Customizable Intention Library**: Add, edit, and manage your own collection of meaningful prompts
- **Flexible Placement**: Choose to insert intentions at the beginning or end of your daily notes
- **Header Control**: Toggle the "Morning Intention" header on/off
- **Hotkey Support**: Customize keyboard shortcuts for quick access
- **Duplicate Prevention**: Won't overwrite existing intentions

## Default Intention Examples

The plugin comes with 47+ thoughtful prompts including:
- "What are my top 3 priorities for today?"
- "How can I make today 1% better than yesterday?"
- "What am I grateful for today?"
- "How do I want to feel by the end of today?"

## Usage

### Automatic Mode
- Create a new daily note and an intention will be automatically inserted
- Requires the Daily Notes core plugin to be enabled

### Manual Mode
- Use Command Palette: "Insert random morning intention at cursor"
- Use the default hotkey: `Ctrl/Cmd + Shift + I`
- Click the dice icon in the ribbon

### Settings
Access plugin settings to:
- Customize your intention library
- Set placement preferences (beginning/end)
- Toggle headers on/off
- Configure custom hotkeys

## Installation

### From Community Plugins (Recommended)
1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Daily Morning Intentions"
4. Install and enable

### Manual Installation
1. Download the latest release files
2. Copy to your vault's `.obsidian/plugins/daily-morning-intentions/` folder
3. Enable in Community Plugins settings

## Support Development

If this plugin helps you start your days more mindfully, consider supporting its development:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/johnfang)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-FF5722?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/johnfang)

Your support helps maintain and improve this plugin!

## Configuration

### Daily Notes Integration
- Requires the Daily Notes core plugin to be enabled
- Respects your Daily Notes folder and format settings
- Works with custom date formats

### Hotkey Customization
- Default: `Ctrl/Cmd + Shift + I` for cursor insertion
- Fully customizable in plugin settings
- Leave empty to disable hotkeys

## Contributing

Found a bug or have a feature request? Please open an issue on GitHub!

## License

MIT License - feel free to use and modify as needed.
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint (optional)
- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code. 
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`


## API Documentation

See https://github.com/obsidianmd/obsidian-api
