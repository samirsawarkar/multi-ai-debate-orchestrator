# Multi-AI Debate Orchestrator 🎭

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green)](https://chrome.google.com/webstore)

A Chrome extension that orchestrates multiple AI chat websites (ChatGPT, Claude, Gemini) into structured, role-based thinking flows by semi-automating prompts, turn-taking, and context passing — **without APIs**.

## ✨ Features

- 🎯 **Role-Based AI Orchestration**: Assign specific roles to each AI (Idea Generator, Devil's Advocate, Judge, etc.)
- 💬 **Live Debate Arena**: Full-page chat interface showing AI conversations in real-time
- 🔄 **Automatic Turn-Taking**: Seamless context passing between multiple AIs
- 📋 **Pre-Built Templates**: Brainstorm, Debate, Validation, and Red Team workflows
- 🎨 **Beautiful UI**: Modern, conversation-style interface with smooth animations
- 🔒 **Privacy-First**: No API keys needed, works directly with AI websites
- 🚀 **Open Source**: Free and open source under MIT license

## 🚀 Quick Start

### Installation

1. **Download the extension:**
   ```bash
   git clone https://github.com/yourusername/multi-ai-debate-orchestrator.git
   cd multi-ai-debate-orchestrator
   ```

2. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top right)
   - Click **"Load unpacked"**
   - Select the extension directory

3. **Login to AI services:**
   - Make sure you're logged into:
     - [ChatGPT](https://chat.openai.com/)
     - [Claude](https://claude.ai/)
     - [Gemini](https://gemini.google.com/)

4. **Start using:**
   - Click the extension icon
   - Select AIs, choose a template, enter your topic
   - Click "Start Debate" and watch the AIs discuss!

## 📖 Usage Guide

### Basic Usage

1. **Open the Arena:**
   - Click the extension icon in your toolbar
   - The full-page Arena UI will open

2. **Configure your debate:**
   - Select which AIs to use (ChatGPT, Claude, Gemini)
   - Choose a template (Brainstorm, Debate, Validation, Red Team)
   - Enter your topic or problem

3. **Start the flow:**
   - Click "Start Debate"
   - Watch as AIs take turns discussing your topic
   - Each AI responds based on its assigned role

4. **Generate conclusion:**
   - After the debate completes, click "Generate Conclusion"
   - One AI will synthesize all responses into a final conclusion

### Templates Explained

#### 🧠 Brainstorm
- **Generator** → Creates raw ideas
- **Critic** → Attacks assumptions and finds flaws
- **Synthesizer** → Improves ideas based on criticism

#### ⚔️ Debate
- **Advocate** → Defends a position
- **Opponent** → Provides counterarguments
- **Judge** → Evaluates and declares winner

#### 🔍 Validation
- **Designer** → Proposes a solution
- **Analyst** → Finds edge cases and problems
- **Assessor** → Evaluates feasibility

#### 🔒 Red Team
- **Architect** → Describes the system
- **Attacker** → Finds vulnerabilities
- **Auditor** → Prioritizes fixes

## 🎯 How It Works

The extension uses **DOM manipulation** (not APIs) to:
1. Inject prompts into AI chat input fields
2. Click send buttons automatically
3. Extract responses when complete
4. Pass context to the next AI in sequence
5. Display everything in a beautiful chat interface

**This is not magic** - it's controlled automation of tasks you'd otherwise do manually.

## ⚠️ Important Notes

### Limitations

- **Requires manual login** to all AI services
- **Sites may change** → extension may break (DOM selectors are fragile)
- **Semi-manual by design** → you stay in control
- **No API access** → uses browser automation
- **Chrome-only** (Manifest V3)

### Best Practices

- ✅ Keep AI tabs open and logged in
- ✅ Refresh AI tabs if extension stops working
- ✅ Check console for errors if something fails
- ✅ Be patient - AIs need time to generate responses

## 🛠️ Troubleshooting

**Extension not working?**
- Ensure you're logged into all AI services
- Refresh the AI tabs (Cmd+R / Ctrl+R)
- Check the background console: `chrome://extensions/` → Service Worker

**Responses not showing?**
- Wait a bit longer (some responses take time)
- Check if AI tabs are still open
- Verify you're on the chat page, not settings

**Flow hangs?**
- Check background service worker console
- Ensure AI tabs haven't closed
- Try stopping and restarting the flow

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Areas that need help:**
- Updating DOM selectors when AI websites change
- Adding support for new AI providers
- Improving error handling
- Creating new templates
- UI/UX improvements

## 📁 Project Structure

```
├── manifest.json              # Extension configuration
├── background.js              # Orchestration logic
├── templates.js               # Pre-built flow templates
├── content-scripts/           # AI site controllers
│   ├── content-chatgpt.js
│   ├── content-claude.js
│   └── content-gemini.js
├── arena/                     # Full-page debate UI
│   ├── arena.html
│   ├── arena.js
│   └── arena.css
├── popup/                     # Quick control UI
├── sidepanel/                 # Advanced control UI
└── icons/                     # Extension icons
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for educational and personal use
- Demonstrates browser extension engineering
- Not affiliated with OpenAI, Anthropic, or Google

## ⚖️ Disclaimer

This extension is for **educational and personal use**. It demonstrates:
- Browser extension engineering (Manifest V3)
- DOM manipulation techniques
- Multi-agent orchestration patterns
- Constraint-based system design

**Use responsibly** and respect AI provider terms of service.

---

**Made with ❤️ by the open source community**

For questions, issues, or contributions, please open an issue on GitHub.

## What This Does

- **One control panel** to manage multiple AI conversations
- **Strict roles** assigned to each AI (Idea Generator, Devil's Advocate, Judge, etc.)
- **Controlled turns** with automatic context passing between AIs
- **Pre-built templates** for common workflows (Brainstorm, Debate, Validation, Red Team)
- **Semi-manual orchestration** - you stay in control, extension handles repetitive tasks

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. Pin the extension icon to your toolbar

## Usage

### Prerequisites
- You must be **logged in** to the AI services you want to use:
  - ChatGPT (chat.openai.com or chatgpt.com)
  - Claude (claude.ai)
  - Gemini (gemini.google.com)
- Open tabs for each AI service (extension will help with this)

### Quick Start
1. Click the extension icon to open the popup
2. Select which AIs to use (checkboxes)
3. Choose a template from the dropdown
4. Enter your topic/problem
5. Click "Start Flow"
6. The extension will orchestrate turns between AIs

### Advanced Mode (Side Panel)
- Click "Open Side Panel" in popup for full control
- Customize roles, constraints, and output formats
- View full context history
- Manual turn advancement for safety
- Save custom templates

## Pre-Built Templates

### 🧠 Brainstorm
- **Generator** → creates raw ideas
- **Critic** → attacks assumptions
- **Synthesizer** → improves based on criticism

### ⚔️ Debate
- **Advocate** → defends position
- **Opponent** → counterarguments
- **Judge** → declares winner

### 🔍 Validation
- **Designer** → proposes solution
- **Analyst** → finds edge cases
- **Assessor** → evaluates feasibility

### 🔒 Red Team
- **Architect** → describes system
- **Attacker** → finds vulnerabilities
- **Auditor** → prioritizes fixes

## Important Limitations

⚠️ **This is a power-user tool. Read these carefully:**

- **Requires manual login** to all AI services
- **Sites may change** → extension breaks (DOM selectors are brittle)
- **Not 100% automatic** → semi-manual by design
- **No guarantees of output quality** → AIs can still be wrong
- **Chrome-only** (Manifest V3)
- **No API access** → uses DOM injection
- **Rate limiting** → adds delays to avoid triggering anti-bot measures
- **No CAPTCHA bypass** → you must solve CAPTCHAs manually

## How It Works

1. **Content scripts** inject prompts into each AI's input field
2. **Background worker** coordinates turn order and context passing
3. **MutationObserver** detects when AI finishes responding
4. **Context extraction** captures responses and passes to next AI
5. **Role templates** enforce structured thinking discipline

This is **not magic**. It's controlled automation of manual tasks you'd otherwise copy-paste.

## Architecture

```
Popup/Side Panel → Background Worker → Content Scripts → AI Websites
                      ↓
                  Chrome Storage (templates, history)
```

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for comprehensive solutions.

**Quick fixes:**

**Extension not working:**
- Ensure you're logged into AI services
- Refresh AI tabs
- Check console errors (Inspect → Console)

**Prompt not injecting:**
- AI websites may have updated (DOM selectors broken)
- Check if you're on the chat page, not settings
- Try manually to verify AI site works

**Response not detected:**
- Wait longer (some responses take time)
- Check if CAPTCHA appeared (solve manually)
- Check AI tab to see if it's still typing

**Flow hangs:**
- Check background service worker console
- Ensure AI tabs haven't closed
- Try "Reset Flow" and restart

For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for full technical documentation.

### Quick Start for Developers

1. **Clone and load:**
   ```bash
   git clone [repo]
   chrome://extensions → Load unpacked
   ```

2. **Test single component:**
   - Content scripts: Inspect AI tab → Console
   - Background: chrome://extensions → Service Worker
   - Popup: Right-click icon → Inspect popup

3. **Update selectors when sites break:**
   - Find new selector on AI website
   - Update `content-scripts/content-[ai].js`
   - Add fallback selectors
   - Test thoroughly

### File Structure
```
├── manifest.json              # Extension configuration
├── background.js              # Orchestration logic
├── storage.js                 # Chrome storage wrapper
├── templates.js               # Pre-built flow templates
├── content-scripts/           # AI site controllers
│   ├── content-chatgpt.js
│   ├── content-claude.js
│   └── content-gemini.js
├── popup/                     # Quick control UI
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── sidepanel/                 # Full control UI
│   ├── sidepanel.html
│   ├── sidepanel.js
│   └── sidepanel.css
├── README.md                  # User guide
├── DEVELOPMENT.md             # Technical docs
└── TROUBLESHOOTING.md         # Debug guide
```

### Known Fragile Points
- **DOM selectors** in content scripts (breaks when sites update)
- **Response detection** timing (varies by AI speed)
- **Tab focus** requirements (some sites need active tab)

## Contributing

Contributions welcome! When updating:
1. Test on actual AI websites
2. Document selector changes with dates
3. Maintain backward compatibility where possible
4. Update README/DEVELOPMENT.md for major changes

## License

MIT - See LICENSE file

## Disclaimer

This extension is for educational and personal use. It demonstrates:
- Browser extension engineering (Manifest V3)
- DOM manipulation techniques
- Multi-agent orchestration patterns
- Constraint-based system design

**Not affiliated with OpenAI, Anthropic, or Google.**

Use responsibly and respect AI provider terms of service.
