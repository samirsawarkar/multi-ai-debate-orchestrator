# Installation Guide

## Quick Installation

### Method 1: Load Unpacked (Recommended for Development)

1. **Download the extension:**
   ```bash
   git clone https://github.com/yourusername/multi-ai-debate-orchestrator.git
   cd multi-ai-debate-orchestrator
   ```

   Or download as ZIP and extract.

2. **Open Chrome Extensions:**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

3. **Enable Developer Mode:**
   - Toggle "Developer mode" switch in the top-right corner

4. **Load the extension:**
   - Click "Load unpacked" button
   - Select the extension directory (the folder containing `manifest.json`)
   - The extension should now appear in your extensions list

5. **Pin to toolbar (optional):**
   - Click the puzzle piece icon (🧩) in Chrome toolbar
   - Find "Multi-AI Debate Orchestrator"
   - Click the pin icon (📌) to keep it visible

## Prerequisites

Before using the extension, make sure you're logged into:

- ✅ [ChatGPT](https://chat.openai.com/) - Create account at openai.com
- ✅ [Claude](https://claude.ai/) - Create account at anthropic.com
- ✅ [Gemini](https://gemini.google.com/) - Use your Google account

**Important:** You must be logged into these services for the extension to work.

## First-Time Setup

1. **Open the extension:**
   - Click the extension icon in your toolbar
   - The Arena UI will open

2. **Verify AI access:**
   - The extension will automatically open tabs for selected AIs
   - Make sure you're logged into each service
   - If not logged in, log in manually

3. **Test the extension:**
   - Select at least 2 AIs
   - Choose a template (try "Brainstorm")
   - Enter a simple topic like "How to improve productivity"
   - Click "Start Debate"
   - Watch the AIs discuss!

## Troubleshooting Installation

### Extension won't load

**Error: "Manifest file is missing or unreadable"**
- Make sure you selected the correct directory
- Verify `manifest.json` exists in the root directory

**Error: "This extension may have been corrupted"**
- Try downloading again
- Check that all files are present
- Verify no files are corrupted

### Extension loads but doesn't work

**Check console for errors:**
1. Go to `chrome://extensions/`
2. Find "Multi-AI Debate Orchestrator"
3. Click "service worker" (for background errors)
4. Or right-click extension icon → "Inspect popup" (for UI errors)

**Common issues:**
- Not logged into AI services → Log in manually
- AI tabs closed → Extension will create new ones
- Outdated selectors → Check GitHub issues for updates

## Updating the Extension

### If installed from source:

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Reload extension:**
   - Go to `chrome://extensions/`
   - Find the extension
   - Click the reload icon (🔄)

### If installed from Chrome Web Store:

- Updates are automatic
- Chrome will notify you when updates are available

## Uninstallation

1. Go to `chrome://extensions/`
2. Find "Multi-AI Debate Orchestrator"
3. Click "Remove"
4. Confirm removal

**Note:** This will delete all stored data (templates, history, etc.)

## System Requirements

- **Chrome Browser**: Version 88+ (Manifest V3 support)
- **Operating System**: Windows, macOS, or Linux
- **Internet Connection**: Required for AI services
- **Accounts**: ChatGPT, Claude, and/or Gemini accounts

## Privacy Note

This extension:
- ✅ Stores data only locally in Chrome
- ✅ Does NOT send data to external servers
- ✅ Does NOT collect personal information
- ✅ Only interacts with AI websites you explicitly use

All data is stored in Chrome's local storage and can be cleared by uninstalling the extension.

## Need Help?

- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Open an issue on [GitHub](https://github.com/yourusername/multi-ai-debate-orchestrator/issues)
- Review [README.md](README.md) for usage instructions
