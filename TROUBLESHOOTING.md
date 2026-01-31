# Troubleshooting Guide

## Common Issues and Solutions

### Extension Won't Load

**Symptoms:**
- Extension doesn't appear in Chrome
- Error on `chrome://extensions` page

**Solutions:**
1. Check manifest.json syntax (valid JSON)
2. Ensure all referenced files exist
3. Try "Reload extension" button
4. Remove and re-add the extension
5. Check Chrome console for errors

---

### "Textarea not found" Error

**Symptoms:**
- Flow starts but immediately fails
- Console shows "Textarea not found"

**Cause:** AI website updated their DOM structure

**Solutions:**
1. Refresh the AI website tab
2. Ensure you're on the chat page (not settings/help)
3. Check if you're logged in
4. Open browser console on AI tab and run:
   ```javascript
   document.querySelector('textarea')
   ```
   If null, selectors need updating

**To fix permanently:**
1. Open DevTools on AI site
2. Inspect the input field
3. Update content script selectors
4. See DEVELOPMENT.md for details

---

### "Send button disabled" Error

**Symptoms:**
- Prompt appears in textarea but doesn't send
- Error: "Send button is disabled"

**Causes:**
- Previous message still processing
- Rate limit hit
- Input too long
- CAPTCHA appeared

**Solutions:**
1. Wait 30 seconds and try again
2. Check AI tab for CAPTCHA - solve it manually
3. Manually click send to test button state
4. Reduce input length
5. Check if AI is rate limiting you

---

### "Response timeout" Error

**Symptoms:**
- Flow hangs for 2 minutes
- Times out waiting for response

**Causes:**
- AI taking very long to respond
- Streaming detection not working
- Network issues

**Solutions:**
1. Check AI tab - is it still typing?
2. If stuck, manually stop generation on AI site
3. Use "Reset Flow" and try again
4. Reduce complexity of prompt
5. Check network connection

**For developers:**
- Increase timeout in `pollForResponse()` function
- Improve streaming detection logic
- Add manual "Response Complete" button

---

### Empty Response Extracted

**Symptoms:**
- Flow completes but context shows empty text
- Error: "Empty response from [AI]"

**Causes:**
- Response selector broken
- Response not fully loaded
- Response is in a special format (image, code block)

**Solutions:**
1. Check AI tab - is there actually a response?
2. Manually copy the response to verify it exists
3. Refresh page and retry
4. Update response selectors in content script

---

### Flow Doesn't Start

**Symptoms:**
- Click "Start Flow" but nothing happens
- No error messages

**Causes:**
- No AIs selected
- No topic entered
- Background script crashed

**Solutions:**
1. Ensure at least 1 AI is checked
2. Enter a topic/problem
3. Check background service worker console:
   - Go to `chrome://extensions`
   - Click "Service Worker" link
   - Look for errors
4. Reload extension

---

### Status Not Updating

**Symptoms:**
- UI shows "Idle" while flow is running
- Turn counter doesn't advance

**Causes:**
- Message passing broken
- Popup closed (messages can't deliver)
- Background script error

**Solutions:**
1. Keep popup or side panel open during flow
2. Use side panel instead of popup (stays open)
3. Check background console for errors
4. Reload extension

---

### Context History Not Showing

**Symptoms:**
- Flow completes but no history appears
- Side panel shows "No conversation history"

**Causes:**
- Context not stored properly
- UI not polling for updates
- Background state cleared

**Solutions:**
1. Refresh side panel
2. Check background console for state:
   ```javascript
   // In background DevTools console
   console.log(state.context)
   ```
3. Try exporting history (may still be in memory)
4. Run flow again

---

### AI Tab Keeps Opening

**Symptoms:**
- New AI tabs open every time
- Multiple tabs for same AI

**Causes:**
- Tab detection logic failing
- Tab registry not persisting

**Solutions:**
1. Manually close duplicate tabs
2. Keep one tab per AI open
3. Check tab registry in background console:
   ```javascript
   console.log(state.tabRegistry)
   ```

---

### Can't Open Side Panel

**Symptoms:**
- "Open Side Panel" button does nothing
- Error in console

**Causes:**
- Chrome version too old (side panel is new)
- Permission issue

**Solutions:**
1. Update Chrome to latest version (v114+)
2. Check manifest has `sidePanel` permission
3. Try right-clicking extension icon → "Open side panel"
4. Use popup instead (fallback)

---

### Login Detection Failing

**Symptoms:**
- Error: "AI not ready"
- Extension says you're not logged in but you are

**Causes:**
- Content script loaded before page ready
- Non-standard login state

**Solutions:**
1. Refresh AI website tab
2. Log out and back in
3. Clear cookies and re-login
4. Wait 5 seconds after page load before starting flow

---

### Rate Limiting / CAPTCHA

**Symptoms:**
- CAPTCHA appears during flow
- "Too many requests" message on AI site

**Causes:**
- Using extension too aggressively
- AI provider rate limiting

**Solutions:**
1. **Solve CAPTCHA manually** - extension will wait
2. Increase delays between turns (edit background.js)
3. Use fewer rounds
4. Wait 5-10 minutes before retrying
5. Consider spreading across different accounts (ethical?)

---

### Slow Performance

**Symptoms:**
- Extension feels laggy
- Tabs freeze
- High CPU usage

**Causes:**
- Polling too aggressively
- Too many tabs open
- Memory leak

**Solutions:**
1. Close unused tabs
2. Reduce polling frequency (edit code)
3. Limit max rounds to 1
4. Reload extension to clear memory

---

## Debugging Tips

### Enable Verbose Logging

1. **Background:**
   - `chrome://extensions` → Extension → "Service Worker"
   - All orchestration logs appear here

2. **Content Scripts:**
   - Open AI website → Right-click → Inspect
   - Console shows injection/extraction logs

3. **Popup/Side Panel:**
   - Right-click extension icon → Inspect popup
   - Or inspect side panel directly

### Check State

In background DevTools console:
```javascript
// View current state
console.log(state)

// Check tab registry
console.log(state.tabRegistry)

// View context history
console.log(state.context)

// Force status broadcast
broadcastStatus()
```

### Manual Testing

Test each component individually:

1. **Test prompt injection:**
   ```javascript
   // In AI tab console
   chrome.runtime.sendMessage({
     type: 'INJECT_PROMPT',
     payload: { prompt: 'Hello, test!' }
   })
   ```

2. **Test response extraction:**
   ```javascript
   chrome.runtime.sendMessage({
     type: 'GET_RESPONSE'
   }, response => console.log(response))
   ```

3. **Test ready check:**
   ```javascript
   chrome.runtime.sendMessage({
     type: 'CHECK_READY'
   }, response => console.log(response))
   ```

### Network Inspection

If AI responses aren't loading:
1. Open Network tab in DevTools
2. Filter to XHR/Fetch
3. Look for API calls to AI backend
4. Check if responses are returning

---

## When to Update Selectors

**Signs selectors are outdated:**
- "Not found" errors for textarea/button/response
- Injection works but send doesn't trigger
- Responses extract wrong content

**How to update:**
1. Inspect element on AI website
2. Find unique selector (ID, data-attribute, class)
3. Update content script `selectors` object
4. Add fallback selectors
5. Test thoroughly
6. Document change with date

---

## Getting Help

If stuck:

1. **Check this guide** - most issues are documented
2. **Check DEVELOPMENT.md** - technical details
3. **Check background/content logs** - errors are logged
4. **Try manual operation** - does the AI website work normally?
5. **Simplify the flow** - test with 1 AI, simple prompt
6. **Open an issue** - provide logs and specific error messages

---

## Known Limitations (Not Bugs)

These are design constraints, not fixable:

- **Requires manual login** - No way around this without APIs
- **DOM selectors break** - Websites change, this is expected
- **Not 100% automatic** - By design, semi-manual is safer
- **Rate limits apply** - Extension can't bypass provider limits
- **Tab focus issues** - Some sites require active tab
- **No parallel execution** - Sequential turns only
- **CAPTCHA blocks flow** - Must solve manually

If you encounter these, it's working as intended. Workarounds exist but trade-offs apply.
