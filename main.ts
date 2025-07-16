import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MorningIntentionSettings {
	intentionLibrary: string[];
}

const DEFAULT_SETTINGS: MorningIntentionSettings = {
	intentionLibrary: [
		"What are my top 3 priorities for today?",
		"What is my why or purpose behind these priorities? How can I remind myself of this throughout the day?",
		"What does my day need to look like for me to feel balanced?",
		"What specific actions can I take today to move me closer to my long-term goals?",
		"How can I make today 1% better than yesterday?",
		"What were my wins from yesterday?",
		"How did I manage my time yesterday? What changes can I make to manage my time better today?",
		"What's one thing I'm proud of accomplishing yesterday?",
		"What is one thing I can do today that will make me feel accomplished?",
		"What's one obstacle I encountered yesterday? How did I overcome it?",
		"What lesson did I learn yesterday that I can bring into today?",
		"What does my best look like today? How much am I able to give to the day?",
		"What distractions do I need to be mindful of today? How can I limit them as much as possible?",
		"How can I approach challenges or setbacks with a growth mindset today?",
		"What positive impact can I make on others today, no matter how small?",
		"How can I be 1% more efficient and productive today? What tools can I use to help me achieve this?",
		"What small step can I take today to improve a skill that directly aligns with my long-term goals?",
		"What is my intention for today?",
		"How do I want my day to go? How can I make this happen?",
		"How would I like to feel by the end of today? How can I make this happen?",
		"How am I feeling mentally, physically and emotionally?",
		"What specific challenges or mini-goals do I have coming up? How can I ensure I'm at my best to handle these?",
		"How can I invite more joy and playfulness into my day?",
		"What is currently feeling good? What feels a little off?",
		"How can I make the rest of my day 1% better?",
		"How did I manage to take care of myself yesterday?",
		"What can I do to take better care of myself today, even if it's just 1% more?",
		"What has been triggering my overwhelm lately? How can I overcome this next time?",
		"What have been my biggest stressors? How can I effectively handle these next time?",
		"What can I do later that will help me decompress after a long, busy day?",
		"How can I support my physical health today? How will I be moving my body today?",
		"How can I support my mental health today?",
		"How can I support my emotional health today?",
		"What's an affirmation I can use today when I am struggling?",
		"What would make today great?",
		"How will I make my day great?",
		"List 3 things you are grateful for today",
		"What are 3 small, everyday things that I often take for granted but am grateful for today?",
		"Write down 5 things in nature you're grateful for",
		"List 3 things you get to do today",
		"What is something I get to do today that I've always wanted to do?",
		"Who is someone I've met recently who had a positive impact on my life?",
		"Name someone who you get to spend time with today",
		"What is one thing I am looking forward to today?",
		"What is one thing I'm grateful for?",
		"List 5 things that are currently making you smile",
		"List a sight, a sound and a feeling that reminds you that life is amazing",
		"Write about something that made you look forward to waking up today",
		"What is one thing that is making me happy today?",
		"Write down a reason why your life today is already great",
		"What is an unforgettable memory that makes me feel happy",
	]
}

export default class MorningIntentionPlugin extends Plugin {
	settings: MorningIntentionSettings;
	private isStartupComplete = false;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Get Random Morning Intention', (evt: MouseEvent) => {
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
		try {
			
			// Get a random intention from the list
			const intention = this.getRandomIntention();
			
			// add intention to daily note
			await this.addIntentionToDaily(intention);
			
		} catch (error) {
			console.error('Error generating morning intention:', error);
			new Notice('Failed to add morning intention to daily note.');
		}
	}

	openPluginSettings() {
		// Open the settings and navigate to this plugin's settings
		// @ts-ignore - accessing internal Obsidian API
		this.app.setting.open();
		// @ts-ignore - accessing internal Obsidian API
		this.app.setting.openTabById('AI-daily-morning-intentions');
	}

	getRandomIntention(): string {
		const intentions = this.settings.intentionLibrary;
		const randomIndex = Math.floor(Math.random() * intentions.length);
		return intentions[randomIndex];
	}

	async addIntentionToDaily(intention: string) {
		try {
			// Use Obsidian's core Daily Notes plugin API
			// @ts-ignore - accessing core plugin internals
			const dailyNotesPlugin = this.app.internalPlugins.plugins['daily-notes'];
			
			if (!dailyNotesPlugin || !dailyNotesPlugin.enabled) {
				new Notice('Daily Notes core plugin is not enabled. Please enable it in Settings > Core plugins.');
				return;
			}

			// Get today's date in the format expected by daily notes
			const today = new Date();
			const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
			
			// Get daily note settings
			// @ts-ignore - accessing plugin settings
			const dailyNotesSettings = dailyNotesPlugin.instance?.options || {};
			const format = dailyNotesSettings.format || 'YYYY-MM-DD';
			const folder = dailyNotesSettings.folder || '';
			const template = dailyNotesSettings.template || '';
			
			// Format the filename according to daily notes settings
			let fileName: string;
			if (format === 'YYYY-MM-DD') {
				fileName = dateStr;
			} else {
				// Use moment-style formatting if available, otherwise fallback to ISO
				fileName = dateStr; // Simplified for now
			}
			
			const fullPath = folder ? `${folder}/${fileName}.md` : `${fileName}.md`;
			console.log('Daily note path:', fullPath);
			
			// Try to get existing daily note
			const dailyNote = this.app.vault.getAbstractFileByPath(fullPath) as TFile;
			
			if (!dailyNote) {

				// If daily note doesn't exist, show notification
				new Notice(`Daily note for ${fileName} does not exist. Please create it first or ensure Daily Notes plugin is configured correctly.`);
				return;


				// // Create new daily note
				// let content = '';
				
				// // If there's a template, use it
				// if (template) {
				// 	const templateFile = this.app.vault.getAbstractFileByPath(template) as TFile;
				// 	if (templateFile) {
				// 		content = await this.app.vault.read(templateFile);
				// 	}
				// }
				
				// // If no template content, create basic structure
				// if (!content.trim()) {
				// 	content = `# ${fileName}\n\n`;
				// }
				
				// // Add the morning intention
				// content += `## Morning Intention\n${intention}\n`;
				
				// dailyNote = await this.app.vault.create(fullPath, content);
			} else {
				// Read existing content and handle intention section
				const content = await this.app.vault.read(dailyNote);
				
				// Check if morning intention already exists
				if (content.includes('## Morning Intention')) {
					// Don't do anything if morning intention already exists
					new Notice('Morning intention already exists in your daily note!');
					return;
				} else {
					// Add new morning intention section
					const newContent = content + `\n\n## Morning Intention\n${intention}\n`;
					await this.app.vault.modify(dailyNote, newContent);
				}
			}
			
			new Notice('Morning intention added to your daily note!');
			
		} catch (error) {
			console.error('Error adding intention to daily note:', error);
			new Notice('Failed to add morning intention to daily note. Please ensure the Daily Notes plugin is enabled.');
		}
	}

	onFileCreated(file: TFile) {
		// Only show notice if startup is complete (to avoid showing for existing files)
		if (!this.isStartupComplete) {
			return;
		}

		// Check if the created file is a daily note
		if (this.isDailyNote(file)) {

			// automatically generate an intention for the new daily note
			this.generateMorningIntention();
		}
	}

	isDailyNote(file: TFile): boolean {
		try {
			// Use Obsidian's core Daily Notes plugin API
			// @ts-ignore - accessing core plugin internals
			const dailyNotesPlugin = this.app.internalPlugins.plugins['daily-notes'];
			
			if (!dailyNotesPlugin || !dailyNotesPlugin.enabled) {
				return false;
			}

			// Get daily note settings
			// @ts-ignore - accessing plugin settings
			const dailyNotesSettings = dailyNotesPlugin.instance?.options || {};
			const format = dailyNotesSettings.format || 'YYYY-MM-DD';
			const folder = dailyNotesSettings.folder || '';
			
			// Get today's date and format it according to daily notes settings
			const today = new Date();
			const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
			
			// Format the filename according to daily notes settings
			let expectedFileName: string;
			if (format === 'YYYY-MM-DD') {
				expectedFileName = dateStr;
			} else {
				// Use moment-style formatting if available, otherwise fallback to ISO
				expectedFileName = dateStr; // Simplified for now
			}
			
			const expectedPath = folder ? `${folder}/${expectedFileName}.md` : `${expectedFileName}.md`;
			
			// Check if this file matches the expected daily note path
			return file.path === expectedPath;
		} catch (error) {
			console.error('Error checking if file is daily note:', error);
			return false;
		}
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

		// Create setting without the text area first
		new Setting(containerEl)
			.setName('Library of Intentions')
			.setDesc('Add your own morning intentions (one per line). These will be randomly selected to be inserted into your Daily Note.');
		
		// Create a separate container for the text area below the description
		const textAreaContainer = containerEl.createDiv();
		textAreaContainer.style.marginTop = '10px';
		
		const textArea = textAreaContainer.createEl('textarea');
		textArea.placeholder = 'Today I choose to focus on what brings me joy...\nI will approach challenges with curiosity...\nI am grateful for this new day...';
		textArea.value = this.plugin.settings.intentionLibrary.join('\n');
		textArea.style.width = '100%';
		textArea.style.minHeight = '200px';
		textArea.style.fontFamily = 'var(--font-monospace)';
		textArea.style.fontSize = 'var(--font-ui-small)';
		textArea.style.padding = '8px';
		textArea.style.border = '1px solid var(--background-modifier-border)';
		textArea.style.borderRadius = '4px';
		textArea.style.backgroundColor = 'var(--background-primary)';
		textArea.style.color = 'var(--text-normal)';
		textArea.style.resize = 'vertical';
		
		textArea.addEventListener('input', async (e) => {
			const target = e.target as HTMLTextAreaElement;
			this.plugin.settings.intentionLibrary = target.value.split('\n').filter(i => i.trim());
			await this.plugin.saveSettings();
		});
	}
}
