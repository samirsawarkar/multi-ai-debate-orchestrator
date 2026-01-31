# Development Guide

## Architecture Overview

This extension orchestrates multiple AI chat websites through DOM manipulation and content scripts. It does NOT use APIs - instead, it programmatically injects prompts and extracts responses from the web interfaces.

### Key Components

1. **manifest.json** - Extension configuration (Manifest V3)
2. **background.js** - Service worker that orchestrates the flow
3. **content-scripts/** - Inject into AI websites to control them
4. **popup/** - Quick control interface
5. **sidepanel/** - Full control interface
6. **templates.js** - Pre-built flow definitions
7. **storage.js** - Chrome storage wrapper

### Data Flow

```
User Input (Popup/Sidepanel)
  ↓
Background Service Worker
  ↓
Content Script (AI Tab)
  ↓
DOM Manipulation (Inject Prompt)
  ↓
AI Website Processes
  ↓
Content Script (Extract Response)
  ↓
Background (Store Context)
  ↓
Next AI in Turn Order
```

## Content Scripts

Each AI provider has its own content script because DOM structures differ:

### ChatGPT (`content-chatgpt.js`)

**Selectors (as of Jan 2026):**
- Textarea: `textarea[data-id="root"]` or `#prompt-textarea`
- Send button: `button[data-testid="send-button"]`
- Response: `[data-message-author-role="assistant"]`

**Key challenges:**
- Streaming detection (no stop button, just check if send button re-enables)
- Multiple textarea elements (must find the right one)

### Claude (`content-claude.js`)

**Selectors:**
- Textarea: `div[contenteditable="true"][data-placeholder]`
- Send button: `button[aria-label*="Send"]`
- Response: Last child of conversation container
- Stop button: `button[aria-label="Stop generating"]`

**Key challenges:**
- Uses contenteditable div, not textarea
- Must detect stop button for streaming status

### Gemini (`content-gemini.js`)

**Selectors:**
- Textarea: `rich-textarea` with `div[contenteditable="true"]` inside
- Send button: `button[aria-label*="Send"]`
- Response: `message-content[agent-type="model"]:last-of-type`

**Key challenges:**
- Nested rich-textarea component
- Custom web components

## Background Orchestration

### State Machine

```
idle → running → (turn loop) → complete
         ↓
       error
```

**State object:**
```javascript
{
  activeFlow: 'brainstorm',
  currentTurn: 0,
  maxRounds: 1,
  aiOrder: [{provider, role, goal, constraints, outputFormat}, ...],
  context: [{ai, role, output, turn}, ...],
  status: 'idle' | 'running' | 'complete' | 'error',
  userTopic: 'string',
  tabRegistry: {chatgpt: tabId, claude: tabId, gemini: tabId}
}
```

### Turn Execution Flow

1. **Build prompt** - Combine role definition + previous context + user topic
2. **Focus tab** - Activate the AI's tab
3. **Inject prompt** - Send message to content script
4. **Poll for response** - Check every 3 seconds if responding=false
5. **Extract response** - Get response text from content script
6. **Store context** - Add to context array
7. **Next turn** - Increment and repeat

### Error Handling

- **Tab not found** → Error, stop flow
- **Content script not ready** → Error, suggest user login
- **Injection fails** → Error with specific message
- **Response timeout (120s)** → Error, suggest manual intervention
- **Empty response** → Error, flag to user

## Templates

Templates define:
- **AI order** - Which AIs participate and in what order
- **Roles** - What each AI should do
- **Goals** - Specific objectives
- **Constraints** - Rules to follow
- **Output formats** - How to structure responses
- **Max rounds** - How many times to loop through AIs

Example template structure:
```javascript
{
  name: 'Brainstorm',
  description: 'Short description',
  ais: [
    {
      provider: 'chatgpt',
      role: 'Idea Generator',
      goal: 'Generate 5 diverse ideas',
      constraints: ['No evaluation', 'No filtering'],
      outputFormat: 'Numbered list'
    },
    // ... more AIs
  ],
  maxRounds: 1
}
```

## Prompt Building

Prompts are constructed from templates:

```
ROLE: [role name]
GOAL: [goal]
CONSTRAINTS:
- [constraint 1]
- [constraint 2]
OUTPUT FORMAT: [format]

PROBLEM/TOPIC:
[user input]

PREVIOUS RESPONSES:
[AI1 Role]:
[response]

[AI2 Role]:
[response]

Your response:
```

This structure enforces discipline and provides context.

## Storage

Using `chrome.storage.local`:

- `selectedAis` - Array of selected AI providers
- `lastTemplate` - Last used template ID
- `history` - Array of past flow executions (max 10)
- `preferences` - User preferences
- `tabRegistry` - Map of provider → tabId

## Known Fragile Points

### 1. DOM Selectors
**Problem:** AI websites update frequently, breaking selectors.

**Solution:** 
- Document current selectors in code
- Provide multiple fallback selectors
- Log errors clearly when selectors fail
- Update promptly when sites change

### 2. Response Detection
**Problem:** Hard to know when AI finishes responding.

**Current approach:**
- Poll for "responding" status every second
- Check if send button is re-enabled
- Timeout after 120 seconds

**Known issues:**
- Some AIs don't disable send button during streaming
- Slow responses may timeout
- Fast responses may be missed if polling too slow

### 3. Tab Focus
**Problem:** Some sites require active tab to work.

**Solution:** 
- Focus tab before injection
- Wait 500ms after focusing
- May still fail if user switches tabs

### 4. Login Detection
**Problem:** Can't reliably detect if user is logged in.

**Current approach:**
- Assume user is logged in
- Fail gracefully if not
- Provide clear error messages

## Testing Strategy

### Manual Testing Checklist

1. **Installation**
   - [ ] Loads without errors
   - [ ] Icons appear
   - [ ] Popup opens
   - [ ] Side panel opens

2. **Single AI Flow**
   - [ ] ChatGPT only
   - [ ] Claude only
   - [ ] Gemini only

3. **Multi-AI Flow**
   - [ ] All three AIs
   - [ ] ChatGPT + Claude
   - [ ] Claude + Gemini

4. **Templates**
   - [ ] Brainstorm template
   - [ ] Debate template
   - [ ] Validation template
   - [ ] Red team template

5. **Edge Cases**
   - [ ] Empty topic
   - [ ] No AIs selected
   - [ ] AI tab closed mid-flow
   - [ ] User not logged in
   - [ ] Very long responses
   - [ ] Multiple rounds

6. **UI**
   - [ ] Status updates correctly
   - [ ] Context history shows
   - [ ] Copy buttons work
   - [ ] Export works
   - [ ] Reset works

### Debugging

**Enable verbose logging:**
1. Open DevTools on background page: `chrome://extensions` → Extension → "Service Worker"
2. Open DevTools on content script: Right-click AI page → Inspect
3. Open DevTools on popup: Right-click extension icon → Inspect popup

**Common errors:**

- "Textarea not found" → Selector broken, update content script
- "Send button disabled" → UI state issue, check if previous response finished
- "Response timeout" → AI taking too long or streaming detection failed
- "No tab found" → Tab was closed or never opened

## Updating for Website Changes

When an AI site updates and breaks:

1. **Identify broken selector**
   - Check console logs in content script
   - Inspect element on AI website
   - Note the new selector

2. **Update content script**
   - Modify `selectors` object
   - Add fallback if possible
   - Test thoroughly

3. **Document change**
   - Add comment with date
   - Note what changed
   - Update README if major

Example:
```javascript
// Updated 2026-01-30: ChatGPT changed textarea ID
textarea: 'textarea[data-id="root"]', // New selector
textareaAlt: '#prompt-textarea', // Old fallback
```

## Performance Considerations

- **Delays between turns**: 2 seconds prevents rate limiting
- **Response polling**: 3 second intervals balances responsiveness vs CPU
- **Tab focus**: 500ms wait allows UI to settle
- **Max rounds**: Limited to 3 to prevent infinite loops
- **History size**: Limited to 10 entries to prevent storage bloat

## Security Considerations

- **No credential storage** - User must login manually
- **No API keys** - Uses web UI only
- **Read-only for most DOM** - Only modifies input fields
- **No background requests** - All actions user-initiated
- **Content script sandboxing** - Limited permissions

## Future Improvements

Potential enhancements (not implemented):

1. **Better response detection** - Use MutationObserver instead of polling
2. **Parallel execution** - Run multiple AIs simultaneously (complex)
3. **Custom templates** - Allow users to save custom flows
4. **More AIs** - Add Perplexity, Bing Chat, etc.
5. **Export formats** - JSON, Markdown, PDF
6. **Flow visualization** - Show turn graph
7. **Retry logic** - Auto-retry failed turns
8. **Manual intervention** - Pause and edit prompts mid-flow

## Contributing

If updating this extension:

1. Test on actual AI websites (not mocks)
2. Update selector comments with dates
3. Maintain fallback selectors
4. Log errors clearly
5. Update README for user-facing changes
6. Document breaking changes in DEVELOPMENT.md

## License

MIT - Use freely, modify as needed, no warranties.
