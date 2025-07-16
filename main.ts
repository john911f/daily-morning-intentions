import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MorningIntentionSettings {
	apiKey: string;
	aiProvider: 'openai' | 'grok';
	customPrompts: string[];
}

const DEFAULT_SETTINGS: MorningIntentionSettings = {
	apiKey: '',
	aiProvider: 'grok',
	customPrompts: [
		'What is one thing I want to focus on today to bring me closer to my goals?',
		'How can I show kindness to myself and others today?',
		'What would make today feel meaningful and fulfilling?',
		'What energy do I want to bring into my day?',
		'How can I practice gratitude and mindfulness today?'
	]
}

export default class MorningIntentionPlugin extends Plugin {
	settings: MorningIntentionSettings;
	private isStartupComplete = false;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Generate Intention Prompt', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.generateMorningIntention();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MorningIntentionTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		// Listen for file creation events to detect new daily notes
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile) {
					this.onFileCreated(file);
				}
			})
		);

		// Wait for workspace to be fully ready before allowing notices
		this.app.workspace.onLayoutReady(() => {
			// Add additional delay after layout is ready to ensure all startup files are processed
			setTimeout(() => {
				this.isStartupComplete = true;
			}, 500); // 1 second delay after layout ready
		});
	}

	onunload() {

	}

	async generateMorningIntention() {
		if (!this.settings.apiKey) {
			const providerName = this.settings.aiProvider === 'openai' ? 'OpenAI' : 'Grok';
			
			// Create a notice with a clickable link to settings
			const notice = new Notice('', 0); // 0 = permanent notice until dismissed
			notice.noticeEl.innerHTML = `Please set your ${providerName} API key in <a href="#" style="color: var(--interactive-accent); text-decoration: underline;">plugin settings</a>.`;
			
			// Add click handler to open settings
			notice.noticeEl.querySelector('a')?.addEventListener('click', (e) => {
				e.preventDefault();
				notice.hide();
				this.openPluginSettings();
			});
			
			return;
		}

		try {
			new Notice('Generating your morning intention...');
			
			// Create a random prompt from custom prompts or use AI to generate one
			const randomPrompt = this.getRandomPrompt();
			const intention = await this.callAI(randomPrompt);
			
			// Create or update today's daily note with the intention
			await this.addIntentionToDaily(intention);
			
		} catch (error) {
			console.error('Error generating morning intention:', error);
			new Notice('Failed to generate morning intention. Check your API key and internet connection.');
		}
	}

	openPluginSettings() {
		// Open the settings and navigate to this plugin's settings
		// @ts-ignore - accessing internal Obsidian API
		this.app.setting.open();
		// @ts-ignore - accessing internal Obsidian API
		this.app.setting.openTabById('AI-daily-morning-intentions');
	}

	getRandomPrompt(): string {
		const prompts = this.settings.customPrompts;
		const randomIndex = Math.floor(Math.random() * prompts.length);
		return prompts[randomIndex];
	}

	async callAI(prompt: string): Promise<string> {
		if (this.settings.aiProvider === 'grok') {
			return this.callGrok(prompt);
		} else {
			return this.callOpenAI(prompt);
		}
	}

	async callOpenAI(prompt: string): Promise<string> {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.settings.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: 'You are a mindful assistant that helps people set positive daily intentions. Respond with a thoughtful, personalized intention in 1-2 sentences that is actionable and inspiring.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 100,
				temperature: 0.7,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API request failed: ${response.status}`);
		}

		const data = await response.json();
		return data.choices[0].message.content.trim();
	}

	async callGrok(prompt: string): Promise<string> {
		const response = await fetch('https://api.x.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.settings.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'grok-beta',
				messages: [
					{
						role: 'system',
						content: 'You are a mindful assistant that helps people set positive daily intentions. Respond with a thoughtful, personalized intention in 1-2 sentences that is actionable and inspiring.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 100,
				temperature: 0.7,
			}),
		});

		if (!response.ok) {
			throw new Error(`Grok API request failed: ${response.status}`);
		}

		const data = await response.json();
		return data.choices[0].message.content.trim();
	}

	async addIntentionToDaily(intention: string) {
		const today = new Date();
		const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
		const fileName = `${dateStr}.md`;
		
		try {
			// Try to get existing daily note
			const dailyNote = this.app.vault.getAbstractFileByPath(fileName);
			
			if (dailyNote instanceof TFile) {
				// File exists, append to it
				const content = await this.app.vault.read(dailyNote);
				const newContent = content + `\n\n## Morning Intention\n${intention}\n`;
				await this.app.vault.modify(dailyNote, newContent);
			} else {
				// Create new daily note
				const newContent = `# ${dateStr}\n\n## Morning Intention\n${intention}\n`;
				await this.app.vault.create(fileName, newContent);
			}
			
			new Notice('Morning intention added to your daily note!');
			
		} catch (error) {
			console.error('Error adding intention to daily note:', error);
			// Fallback: just show the intention in a notice
			new Notice(`Your intention: ${intention}`);
		}
	}

	onFileCreated(file: TFile) {
		// Only show notice if startup is complete (to avoid showing for existing files)
		if (!this.isStartupComplete) {
			return;
		}

		// Check if the created file is a daily note
		if (this.isDailyNote(file)) {
			new Notice('New daily note created');
		}
	}

	isDailyNote(file: TFile): boolean {
		// Check for common daily note patterns
		const commonDatePatterns = [
			/^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
			/^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
			/^\d{4}\d{2}\d{2}$/,   // YYYYMMDD
		];
		
		return commonDatePatterns.some(pattern => pattern.test(file.basename));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class MorningIntentionTab extends PluginSettingTab {
	plugin: MorningIntentionPlugin;

	constructor(app: App, plugin: MorningIntentionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('AI Provider')
			.setDesc('Choose which AI service to use for generating intentions')
			.addDropdown(dropdown => dropdown
				.addOption('openai', 'OpenAI (ChatGPT)')
				.addOption('grok', 'Grok (xAI)')
				.setValue(this.plugin.settings.aiProvider)
				.onChange(async (value: 'openai' | 'grok') => {
					this.plugin.settings.aiProvider = value;
					await this.plugin.saveSettings();
					// Refresh the display to update the API key description
					this.display();
				}));

		const apiKeyDesc = this.plugin.settings.aiProvider === 'openai' 
			? 'Enter your OpenAI API key (get one at https://platform.openai.com/api-keys)'
			: 'Enter your Grok API key (get one at https://console.x.ai/)';

		new Setting(containerEl)
			.setName('API Key')
			.setDesc(apiKeyDesc)
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Custom Prompts')
			.setDesc('Add your own intention prompts (one per line)')
			.addTextArea(text => text
				.setPlaceholder('Enter custom prompts...')
				.setValue(this.plugin.settings.customPrompts.join('\n'))
				.onChange(async (value) => {
					this.plugin.settings.customPrompts = value.split('\n').filter(p => p.trim());
					await this.plugin.saveSettings();
				}));
	}
}
