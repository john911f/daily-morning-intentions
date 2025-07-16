import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, TFile, Modifier, Hotkey } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MorningIntentionSettings {
	intentionLibrary: string[];
	intentionPlacement: 'first' | 'last';
	includeHeader: boolean;
	cursorHotkey: string;
	headerText: string;
	headerLevel: number;
}

const DEFAULT_SETTINGS: MorningIntentionSettings = {
	intentionPlacement: 'last',
	includeHeader: true,
	cursorHotkey: 'Mod+Shift+I',
	headerText: 'Morning Intention',
	headerLevel: 2,
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

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MorningIntentionTab(this.app, this));

		// Add command to insert intention at cursor (supports hotkey assignment)
		this.addCommand({
			id: 'insert-intention-at-cursor',
			name: 'Insert random morning intention at cursor',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.insertIntentionAtCursor(editor);
			},
			hotkeys: this.parseHotkey(this.settings.cursorHotkey)
		});


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

	parseHotkey(hotkeyString: string): Hotkey[] {
		if (!hotkeyString || hotkeyString.trim() === '') {
			return [];
		}

		try {
			const parts = hotkeyString.split('+').map(part => part.trim());
			if (parts.length === 0) return [];

			const key = parts.pop(); // Last part is the key
			const modifiers = parts as Modifier[]; // Everything else are modifiers

			if (!key) return [];

			return [{
				modifiers: modifiers,
				key: key.toLowerCase()
			}];
		} catch (error) {
			console.error('Error parsing hotkey:', hotkeyString, error);
			return [];
		}
	}

	insertIntentionAtCursor(editor: Editor) {
		try {
			// Get a random intention from the list
			const intention = this.getRandomIntention();
			
			// Get current cursor position
			const cursor = editor.getCursor();
					// Determine what text to insert based on header setting
		let textToInsert: string;
		if (this.settings.includeHeader) {
			const headerPrefix = '#'.repeat(this.settings.headerLevel);
			textToInsert = `${headerPrefix} ${this.settings.headerText}\n${intention}`;
		} else {
			textToInsert = intention;
		}
			
			// Insert the intention at cursor position
			editor.replaceRange(textToInsert, cursor);
			
			// Move cursor to end of inserted text
			const lines = textToInsert.split('\n');
			const newCursor = {
				line: cursor.line + lines.length - 1,
				ch: lines[lines.length - 1].length
			};
			editor.setCursor(newCursor);
			
			new Notice('Morning intention inserted at cursor!');
			
		} catch (error) {
			console.error('Error inserting intention at cursor:', error);
			new Notice('Failed to insert morning intention.');
		}
	}

	async setCursorAfterIntention(file: TFile, intention: string) {
		try {
			// Open the file in the active workspace
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(file);
			
			// Get the editor view
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) return;
			
			const editor = view.editor;
			const content = editor.getValue();
			
			// Find the line where the intention was inserted
			const lines = content.split('\n');
			let targetLine = -1;
			
			// Look for the intention text in the content
			for (let i = 0; i < lines.length; i++) {
				if (lines[i].includes(intention)) {
					targetLine = i;
					break;
				}
			}
			
			if (targetLine >= 0) {
				// Set cursor to the end of the intention line + 1 (next line)
				const nextLine = targetLine + 1;
				let targetColumn = 0;
				
				// If there's a next line, position at the end of it, otherwise create a new line
				if (nextLine < lines.length) {
					targetColumn = lines[nextLine].length;
				} else {
					// Add a new line after the intention
					editor.replaceRange('\n', { line: targetLine, ch: lines[targetLine].length });
					targetColumn = 0;
				}
				
				// Set the cursor position
				editor.setCursor({ line: nextLine, ch: targetColumn });
			}
		} catch (error) {
			console.error('Error setting cursor position:', error);
		}
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
				const headerPrefix = '#'.repeat(this.settings.headerLevel);
				const expectedHeader = `${headerPrefix} ${this.settings.headerText}`;
				const hasHeader = content.includes(expectedHeader);
				let hasIntention = false;
				
				if (hasHeader) {
					hasIntention = true;
				} else if (!this.settings.includeHeader) {
					// If header is disabled, check if any of our intentions already exist in the content
					const existingIntentions = this.settings.intentionLibrary.some(intent => 
						content.includes(intent.trim())
					);
					hasIntention = existingIntentions;
				}
				
				if (hasIntention) {
					// Don't do anything if morning intention already exists
					new Notice('Morning intention already exists in your daily note!');
					return;
				} else {
					// Add new morning intention section based on user preference
					let newContent: string;
					if (this.settings.intentionPlacement === 'first') {
						// Insert at the beginning after any title
						const lines = content.split('\n');
						let insertIndex = 0;
						
						// Skip the title if it exists (first line starting with #)
						if (lines[0] && lines[0].startsWith('#')) {
							insertIndex = 1;
							// Also skip any empty lines after the title
							while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
								insertIndex++;
							}
						}
						
						// Insert the morning intention
						const beforeLines = lines.slice(0, insertIndex);
						const afterLines = lines.slice(insertIndex);
						
						let intentionLines: string[];
						// Check if we need spacing - add blank line only if there's content after the insertion point
						const needsSpacingAfter = afterLines.some(line => line.trim() !== '');
						
						if (this.settings.includeHeader) {
							const headerPrefix = '#'.repeat(this.settings.headerLevel);
							const header = `${headerPrefix} ${this.settings.headerText}`;
							intentionLines = needsSpacingAfter ? 
								[header, intention, ''] : 
								[header, intention];
						} else {
							intentionLines = needsSpacingAfter ? 
								[intention, ''] : 
								[intention];
						}
						
						newContent = [...beforeLines, ...intentionLines, ...afterLines].join('\n');
					} else {
						// Append at the end (default behavior)
						// Check if the content is empty or just whitespace
						const hasExistingContent = content.trim() !== '';
						
						if (this.settings.includeHeader) {
							const headerPrefix = '#'.repeat(this.settings.headerLevel);
							const header = `${headerPrefix} ${this.settings.headerText}`;
							if (hasExistingContent) {
								newContent = content + `\n\n${header}\n${intention}`;
							} else {
								newContent = `${header}\n${intention}`;
							}
						} else {
							if (hasExistingContent) {
								newContent = content + `\n\n${intention}`;
							} else {
								newContent = intention;
							}
						}
					}
					
					await this.app.vault.modify(dailyNote, newContent);
					
					// Set cursor position after the inserted intention
					this.setCursorAfterIntention(dailyNote, intention);
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

class MorningIntentionTab extends PluginSettingTab {
	plugin: MorningIntentionPlugin;

	constructor(app: App, plugin: MorningIntentionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		// Support section
		containerEl.createEl('h2', {text: 'Support Development'});
		
		const donationDesc = containerEl.createDiv();
		donationDesc.innerHTML = `

			<p>Loving this plugin? Your support keeps the good vibes and updates coming! 😄 Consider tossing a small donation my way to fuel more awesome features. Thank you! 🙌</p>
			<div style="display: flex; gap: 10px; margin: 10px 0;">
				<a href="https://buymeacoffee.com/johnfang" target="_blank" style="text-decoration: none;">
					<button style="background: #FFDD00; color: #000; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">☕ Buy Me a Coffee</button>
				</a>
				<a href="https://ko-fi.com/johnfang" target="_blank" style="text-decoration: none;">
					<button style="background: #FF5722; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">🎁 Ko-fi</button>
				</a>
			</div>
		`;

		containerEl.createEl('hr');
		containerEl.createEl('h2', {text: 'Plugin Settings'});

		// Intention placement setting
		new Setting(containerEl)
			.setName('Intention Placement')
			.setDesc('Choose where to place the morning intention in your daily note.')
			.addDropdown(dropdown => dropdown
				.addOption('last', 'Append at the end')
				.addOption('first', 'Insert at the beginning (after title)')
				.setValue(this.plugin.settings.intentionPlacement)
				.onChange(async (value: 'first' | 'last') => {
					this.plugin.settings.intentionPlacement = value;
					await this.plugin.saveSettings();
				}));

		// Include header setting
		new Setting(containerEl)
			.setName('Include Header')
			.setDesc('Whether to include a header when inserting the intention.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeHeader)
				.onChange(async (value: boolean) => {
					this.plugin.settings.includeHeader = value;
					await this.plugin.saveSettings();
				}));

		// Header text setting
		new Setting(containerEl)
			.setName('Header Text')
			.setDesc('Custom text for the intention header.')
			.addText(text => text
				.setPlaceholder('Morning Intention')
				.setValue(this.plugin.settings.headerText)
				.onChange(async (value: string) => {
					this.plugin.settings.headerText = value;
					await this.plugin.saveSettings();
				}));

		// Header level setting
		new Setting(containerEl)
			.setName('Header Level')
			.setDesc('Choose the heading level for the intention header (H1-H6).')
			.addDropdown(dropdown => dropdown
				.addOption('1', 'H1 (#)')
				.addOption('2', 'H2 (##)')
				.addOption('3', 'H3 (###)')
				.addOption('4', 'H4 (####)')
				.addOption('5', 'H5 (#####)')
				.addOption('6', 'H6 (######)')
				.setValue(this.plugin.settings.headerLevel.toString())
				.onChange(async (value: string) => {
					this.plugin.settings.headerLevel = parseInt(value);
					await this.plugin.saveSettings();
				}));

		// Cursor hotkey setting
		new Setting(containerEl)
			.setName('Cursor Insertion Hotkey')
			.setDesc('Hotkey for inserting intention at cursor (format: Mod+Shift+I). Use "Mod" for Ctrl/Cmd, leave empty to disable.')
			.addText(text => text
				.setPlaceholder('Mod+Shift+I')
				.setValue(this.plugin.settings.cursorHotkey)
				.onChange(async (value: string) => {
					this.plugin.settings.cursorHotkey = value;
					await this.plugin.saveSettings();
					// Show notice that restart is needed for hotkey changes
					new Notice('Restart Obsidian for hotkey changes to take effect.');
				}));


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
