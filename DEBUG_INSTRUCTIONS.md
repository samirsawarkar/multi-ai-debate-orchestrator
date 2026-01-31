# Critical Debugging Steps

## You're looking at the WRONG console!

The messages you're seeing are from the **ChatGPT page console**.

You need to look at the **BACKGROUND SERVICE WORKER console** instead!

## How to Open the Correct Console:

### Step 1: Go to Extensions Page
```
chrome://extensions/
```

### Step 2: Find "Multi-AI Debate Orchestrator"
Scroll down to find our extension

### Step 3: Click "service worker" Link
You'll see a blue link that says "service worker" - CLICK IT

This will open a NEW DevTools window for the background script.

### Step 4: Look at THIS Console
This is where you'll see:
- `[Background] Templates imported successfully: ...`
- `[Background] Received message: START_FLOW ...`
- The ACTUAL error message

## What to Look For:

After clicking "service worker", you should see:
```
[Background] Templates imported successfully: true
[Background] Available templates: ['brainstorm', 'debate', 'validation', 'redteam']
```

If you DON'T see this, the templates didn't load!

Then when you click "Start Flow", you should see:
```
[Background] Received message: START_FLOW {type: 'START_FLOW', payload: {...}}
[Background] handleStartFlow called with: {selectedAis: [...], template: '...', topic: '...'}
```

This will show the REAL error!
