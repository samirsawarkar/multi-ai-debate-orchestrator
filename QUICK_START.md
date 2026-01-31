# Quick Start Guide

## 5-Minute Setup

### 1. Install Extension (1 min)

1. Open Chrome
2. Navigate to `chrome://extensions`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `Turnwise` folder
6. Pin the extension icon to toolbar

### 2. Login to AI Services (2 min)

Open these sites and login:
- [ChatGPT](https://chat.openai.com)
- [Claude](https://claude.ai)
- [Gemini](https://gemini.google.com)

Keep tabs open (extension will find them).

### 3. Run Your First Flow (2 min)

**Option A: Quick Mode (Popup)**

1. Click extension icon
2. Check all three AIs (ChatGPT, Claude, Gemini)
3. Select "🧠 Brainstorm" template
4. Enter topic: "How to improve remote team communication"
5. Click "Start Flow"
6. Watch the magic happen!

**Option B: Full Control (Side Panel)**

1. Click extension icon
2. Click "Open Side Panel"
3. Configure AIs and template
4. Enter topic
5. Click "Start Flow"
6. View context history as it builds

---

## Your First Brainstorm

**Template:** 🧠 Brainstorm  
**Topic:** "How to reduce carbon footprint in daily life"

**What happens:**

1. **ChatGPT (Idea Generator)** generates 5 raw ideas
2. **Claude (Devil's Advocate)** attacks assumptions and finds flaws
3. **Gemini (Synthesizer)** improves ideas based on criticism

**Result:** You get diverse perspectives without manually copy-pasting between AIs.

---

## Your First Debate

**Template:** ⚔️ Debate  
**Topic:** "Should AI development be regulated by government?"

**What happens:**

1. **ChatGPT (Advocate)** defends: "Yes, regulation is necessary"
2. **Claude (Opponent)** counters with arguments against regulation
3. **Gemini (Judge)** evaluates both sides and declares winner

**Result:** Balanced analysis from opposed viewpoints.

---

## Tips for Success

### ✅ Do This

- **Keep AI tabs open** - Extension needs them
- **Stay logged in** - Can't work with logged-out sessions
- **Use simple topics first** - Test with basic questions
- **Check side panel** - See context history build up
- **Be patient** - AIs take time to respond

### ❌ Avoid This

- **Don't close AI tabs** during flow
- **Don't run multiple flows** simultaneously
- **Don't use very long topics** - Keep under 500 chars
- **Don't expect perfection** - DOM selectors can break
- **Don't spam flows** - Risk rate limiting

---

## Understanding Templates

Each template defines:

- **AI roles** - What each AI should do
- **Turn order** - Who goes first, second, third
- **Constraints** - Rules each AI must follow
- **Max rounds** - How many times to loop

### 🧠 Brainstorm
**Use for:** Idea generation, creative thinking  
**Turns:** 3 (Generator → Critic → Synthesizer)  
**Time:** ~3-5 minutes

### ⚔️ Debate
**Use for:** Exploring both sides of an issue  
**Turns:** 6 (2 rounds of Advocate → Opponent → Judge)  
**Time:** ~5-8 minutes

### 🔍 Validation
**Use for:** Testing solutions, finding edge cases  
**Turns:** 3 (Designer → Analyst → Assessor)  
**Time:** ~3-5 minutes

### 🔒 Red Team
**Use for:** Security analysis, vulnerability testing  
**Turns:** 3 (Architect → Attacker → Auditor)  
**Time:** ~3-5 minutes

---

## Troubleshooting (Quick Fixes)

**Nothing happens when I click Start:**
- Check: Are AIs selected? ✓
- Check: Is topic entered? ✓
- Check: Are you logged into AI sites? ✓

**"Textarea not found" error:**
- Refresh AI tabs
- Ensure you're on chat page (not settings)
- AI website may have updated (see TROUBLESHOOTING.md)

**Flow hangs:**
- Check if CAPTCHA appeared (solve manually)
- Check if AI is still typing (wait)
- Click "Stop" and restart

**See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more.**

---

## Next Steps

### Beginner
- [x] Run a Brainstorm flow
- [ ] Try all 4 templates
- [ ] Export history as text file
- [ ] Use side panel for full view

### Intermediate
- [ ] Customize role constraints in side panel
- [ ] Try with 2 AIs instead of 3
- [ ] Run multiple rounds (change max rounds)
- [ ] Copy responses to external document

### Advanced
- [ ] Read [DEVELOPMENT.md](DEVELOPMENT.md)
- [ ] Update DOM selectors when sites break
- [ ] Create custom templates (edit templates.js)
- [ ] Contribute improvements

---

## Example Use Cases

**Product Development:**
- Brainstorm features → Critique feasibility → Synthesize roadmap

**Content Creation:**
- Generate article outlines → Attack weak arguments → Refine structure

**Decision Making:**
- Propose solution → Find edge cases → Assess viability

**Learning:**
- Ask question → Challenge assumptions → Synthesize understanding

**Security:**
- Describe system → Identify vulnerabilities → Prioritize fixes

---

## Support

- **Bugs:** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Technical:** Read [DEVELOPMENT.md](DEVELOPMENT.md)
- **Questions:** Open an issue
- **Ideas:** Contributions welcome!

---

## Remember

This is a **semi-manual power tool**, not a magic button.

- You control the flow
- You verify outputs
- You stay in charge

The extension just saves you from copy-pasting between tabs. The thinking is still yours.

**Enjoy orchestrating AIs!** 🎭
