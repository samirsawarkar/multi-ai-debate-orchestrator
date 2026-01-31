# Installation Instructions

## Chrome Installation (Recommended)

### Prerequisites
- Chrome version 114 or higher
- Active internet connection
- Accounts on ChatGPT, Claude, and/or Gemini

### Step-by-Step

1. **Download the Extension**
   ```bash
   git clone [repository-url]
   # OR download and extract ZIP
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions`
   - Or: Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" switch in top-right corner
   - This allows loading unpacked extensions

4. **Load Extension**
   - Click "Load unpacked" button
   - Select the `Turnwise` folder (the one containing manifest.json)
   - Extension icon should appear in toolbar

5. **Pin Extension (Optional)**
   - Click puzzle piece icon in toolbar
   - Find "AI Orchestrator"
   - Click pin icon to keep visible

6. **Verify Installation**
   - Click extension icon → popup should open
   - Check for any error messages
   - If errors: See Troubleshooting below

### Post-Installation Setup

1. **Login to AI Services**
   - Open [ChatGPT](https://chat.openai.com) → Login
   - Open [Claude](https://claude.ai) → Login
   - Open [Gemini](https://gemini.google.com) → Login

2. **Keep Tabs Open**
   - Extension finds existing tabs automatically
   - Or click "Open AI Tabs" in popup

3. **Test Basic Flow**
   - Select one AI (e.g., ChatGPT)
   - Choose "Brainstorm" template
   - Enter simple topic: "Test"
   - Click "Start Flow"
   - Should inject prompt and get response

---

## Firefox Installation (Experimental)

Currently Chrome-only due to `sidePanel` API. Firefox support requires:
- Removing side panel features
- Adjusting manifest to v2 format
- Testing with Firefox APIs

Not officially supported yet.

---

## Edge Installation

Works with Chromium-based Edge:
1. Navigate to `edge://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select extension folder
5. Follow Chrome steps above

---

## Updating the Extension

When extension code is updated:

1. **Pull Latest Code**
   ```bash
   cd /path/to/Turnwise
   git pull
   ```

2. **Reload Extension**
   - Go to `chrome://extensions`
   - Find "AI Orchestrator"
   - Click reload icon (circular arrow)

3. **Hard Refresh (if issues)**
   - Remove extension
   - Close all AI tabs
   - Restart Chrome
   - Re-install extension

---

## Uninstallation

1. **Remove Extension**
   - `chrome://extensions`
   - Find "AI Orchestrator"
   - Click "Remove"

2. **Clear Storage (Optional)**
   - Extension storage auto-clears on removal
   - To verify: DevTools → Application → Storage → Clear

3. **Delete Files**
   ```bash
   rm -rf /path/to/Turnwise
   ```

---

## Permissions Explained

Extension requests these permissions:

- **tabs** - To find/create AI tabs
- **storage** - To save templates and history
- **sidePanel** - To open side panel UI
- **scripting** - To inject content scripts

And these host permissions:

- **chat.openai.com** - ChatGPT control
- **chatgpt.com** - ChatGPT control (alt domain)
- **claude.ai** - Claude control
- **gemini.google.com** - Gemini control

**Why needed:**
- Extension must inject code into these sites to work
- No other sites are accessed
- No data leaves your browser

---

## Troubleshooting Installation

### "Manifest file is missing or unreadable"
- Ensure you selected the correct folder
- manifest.json must be in root of selected folder
- Check manifest.json is valid JSON (no syntax errors)

### Extension loads but icon is gray/disabled
- Permissions not granted
- Try reloading extension
- Check Chrome version (need 114+)

### "Service worker registration failed"
- background.js has syntax error
- Check browser console for specific error
- Verify all imported scripts exist (templates.js, etc.)

### Content scripts not injecting
- Host permissions not granted
- Check manifest host_permissions matches AI URLs
- Verify content script files exist

### Popup won't open
- popup.html not found
- Check file path in manifest
- Try inspecting popup for errors

---

## Advanced: Building from Source

If modifying the extension:

1. **Make Changes**
   - Edit JS/HTML/CSS files
   - Follow code style in existing files

2. **Test Changes**
   - Reload extension in Chrome
   - Test affected functionality
   - Check console for errors

3. **Package for Distribution** (optional)
   ```bash
   # Create ZIP for sharing
   zip -r turnwise-v1.0.zip . -x "*.git*" "*.DS_Store"
   ```

4. **Chrome Web Store** (official distribution)
   - Requires developer account
   - Must package as .crx
   - See Chrome Web Store docs

---

## System Requirements

**Minimum:**
- Chrome 114+
- 4GB RAM
- Internet connection

**Recommended:**
- Chrome 120+
- 8GB RAM
- Fast internet (AI responses are large)

**Disk Space:**
- Extension: < 1MB
- Chrome storage: < 5MB (for history)

---

## Network Requirements

- **Outbound:** Must reach AI provider domains
- **Inbound:** None required
- **Firewall:** Allow Chrome to access internet
- **Proxy:** Should work through most proxies
- **VPN:** Compatible

Extension doesn't make direct API calls, just loads AI websites normally.

---

## Security Notes

- Extension runs in sandboxed environment
- No credentials stored by extension
- No network requests from extension code
- Content scripts have limited permissions
- All data stays local in Chrome storage

**Still concerned?**
- Review source code (it's all here)
- Check Network tab (no unexpected requests)
- Monitor Chrome storage (Settings → Privacy)

---

## Getting Help

**Installation issues:**
1. Check this guide
2. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Open issue with error messages

**General help:**
- [QUICK_START.md](QUICK_START.md) - Basic usage
- [README.md](README.md) - Overview
- [DEVELOPMENT.md](DEVELOPMENT.md) - Technical details
