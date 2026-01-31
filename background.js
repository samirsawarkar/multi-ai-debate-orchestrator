// Background service worker for AI Orchestrator
// Handles orchestration, turn sequencing, and message routing

// Import templates
try {
  importScripts('templates.js');
  console.log('[Background] Templates imported successfully:', typeof TEMPLATES !== 'undefined');
  console.log('[Background] Available templates:', typeof TEMPLATES !== 'undefined' ? Object.keys(TEMPLATES) : 'UNDEFINED');
  console.log('[Background] buildPrompt function:', typeof buildPrompt);
} catch (error) {
  console.error('[Background] Failed to import templates.js:', error);
}

// Global state
const state = {
  activeFlow: null,
  currentTurn: 0,
  maxRounds: 1,
  aiOrder: [],
  context: [], // Array of {ai, role, output}
  status: 'idle', // idle | running | paused | complete | error
  userTopic: '',
  templateConfig: null,
  tabRegistry: {} // Map provider -> tabId
};

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Extension installed');
});

// Message routing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type, message);
  
  switch (message.type) {
    case 'START_FLOW':
      console.log('[Background] Starting flow with payload:', message.payload);
      handleStartFlow(message.payload)
        .then(() => {
          console.log('[Background] Flow started successfully');
          sendResponse({ success: true });
        })
        .catch(error => {
          console.error('[Background] Flow error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep channel open
      
    case 'STOP_FLOW':
      handleStopFlow();
      sendResponse({ success: true });
      break;
      
    case 'CONTENT_STATUS':
      handleContentStatus(message.payload);
      sendResponse({ success: true });
      break;
      
    case 'GET_STATE':
      sendResponse({ state });
      break;
      
    case 'GENERATE_CONCLUSION':
      handleGenerateConclusion(message.payload)
        .then(response => {
          sendResponse({ success: true, response });
        })
        .catch(error => {
          console.error('[Background] Conclusion error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep channel open
      
    default:
      console.warn('[Background] Unknown message type:', message.type);
  }
});

// Handle start flow
async function handleStartFlow(payload) {
  try {
    console.log('[Background] handleStartFlow called with:', payload);
    
    if (!payload) {
      throw new Error('No payload provided');
    }
    
    const { selectedAis, template, topic } = payload;
    
    console.log('[Background] Extracted values:', { selectedAis, template, topic });
    
    if (state.status === 'running') {
      throw new Error('Flow already running');
    }
    
    if (!selectedAis || selectedAis.length === 0) {
      throw new Error('No AIs selected');
    }
    
    if (!topic || topic.trim().length === 0) {
      throw new Error('No topic provided');
    }
    
    // Check if TEMPLATES is loaded
    if (typeof TEMPLATES === 'undefined') {
      throw new Error('Templates not loaded - background.js failed to import templates.js');
    }
    
    console.log('[Background] Available templates:', Object.keys(TEMPLATES));
    
    // Load template
    const templateConfig = TEMPLATES[template];
    if (!templateConfig) {
      throw new Error(`Template "${template}" not found. Available: ${Object.keys(TEMPLATES).join(', ')}`);
    }
    
    console.log('[Background] Loaded template config:', templateConfig);
    
    // Filter template AIs based on selection
    const filteredAis = templateConfig.ais.filter(ai => 
      selectedAis.includes(ai.provider)
    );
    
    if (filteredAis.length === 0) {
      throw new Error('No matching AIs in template');
    }
    
    // Initialize state
    state.activeFlow = template;
    state.currentTurn = 0;
    state.maxRounds = templateConfig.maxRounds;
    state.aiOrder = filteredAis;
    state.context = [];
    state.userTopic = topic;
    state.templateConfig = templateConfig;
    state.status = 'running';
    
    console.log('[Background] Flow started:', template);
    console.log('[Background] AI order:', filteredAis.map(ai => ai.provider));
    
    // Find or create tabs for each AI
    await ensureAiTabs(selectedAis);
    
    // Give tabs extra time to load and content scripts to inject
    console.log('[Background] Waiting 3 seconds for tabs to fully load...');
    await sleep(3000);
    
    // Verify all tabs are ready (with retries)
    console.log('[Background] Verifying AI tabs are ready...');
    const allReady = await verifyAiTabsReady(selectedAis);
    if (!allReady) {
      state.status = 'error';
      const errorMsg = 'Some AI tabs are not ready. Please:\n1. Ensure you are logged in to all selected AI services\n2. Refresh the AI tabs (Cmd+R or Ctrl+R)\n3. Try again';
      broadcastStatus({ error: errorMsg });
      throw new Error(errorMsg);
    }
    
    // Broadcast status
    broadcastStatus();
    
    // Start first turn
    await executeNextTurn();
  } catch (error) {
    console.error('[Background] Start flow error:', error);
    state.status = 'error';
    broadcastStatus({ error: error.message });
    throw error;
  }
}

// Handle stop flow
function handleStopFlow() {
  state.status = 'idle';
  state.activeFlow = null;
  console.log('[Background] Flow stopped');
  broadcastStatus();
}

// Handle content script status updates
function handleContentStatus(payload) {
  const { provider, ready, responding } = payload;
  console.log(`[Background] ${provider} status: ready=${ready}, responding=${responding}`);
}

// Execute next turn in the flow
async function executeNextTurn() {
  if (state.status !== 'running') {
    return;
  }
  
  const totalTurns = state.aiOrder.length * state.maxRounds;
  
  if (state.currentTurn >= totalTurns) {
    // Flow complete
    state.status = 'complete';
    console.log('[Background] Flow complete');
    broadcastStatus();
    
    // Save to history
    await saveFlowHistory();
    return;
  }
  
  // Get current AI config
  const aiIndex = state.currentTurn % state.aiOrder.length;
  const currentAi = state.aiOrder[aiIndex];
  const round = Math.floor(state.currentTurn / state.aiOrder.length);
  
  console.log(`[Background] Turn ${state.currentTurn + 1}/${totalTurns}: ${currentAi.provider} (Round ${round + 1})`);
  
  // Build prompt with role and context
  const prompt = buildPrompt(currentAi, state.context, state.userTopic);
  
  // Find tab for this AI
  const tabId = state.tabRegistry[currentAi.provider];
  if (!tabId) {
    state.status = 'error';
    broadcastStatus({ error: `No tab found for ${currentAi.provider}` });
    return;
  }
  
  // Broadcast current turn
  broadcastStatus({
    currentTurn: state.currentTurn + 1,
    totalTurns,
    aiName: currentAi.provider,
    role: currentAi.role
  });
  
    try {
      // Focus tab temporarily to inject prompt (some sites need this)
      // But don't switch user's view - they stay on Arena tab
      // await chrome.tabs.update(tabId, { active: true });
      // await sleep(500);
      
      // Inject prompt (tab doesn't need to be active)
      const injectResponse = await chrome.tabs.sendMessage(tabId, {
        type: 'INJECT_PROMPT',
        payload: { prompt }
      });
    
    if (!injectResponse || !injectResponse.success) {
      throw new Error(`Failed to inject prompt into ${currentAi.provider}: ${injectResponse?.error || 'Unknown error'}`);
    }
    
    // Wait for response (poll content script)
    const response = await pollForResponse(tabId, currentAi.provider);
    
    if (!response || response.trim().length === 0) {
      throw new Error(`Empty response from ${currentAi.provider}`);
    }
    
    // Store in context
    state.context.push({
      ai: currentAi.provider,
      role: currentAi.role,
      output: response,
      turn: state.currentTurn
    });
    
    // Move to next turn
    state.currentTurn++;
    
    // Wait before next turn
    await sleep(2000);
    
    // Execute next turn
    await executeNextTurn();
    
  } catch (error) {
    console.error('[Background] Turn error:', error);
    state.status = 'error';
    broadcastStatus({ 
      error: `Turn failed: ${error.message}. Please check if you're logged in and the AI is responding.` 
    });
  }
}

// Poll content script for response
async function pollForResponse(tabId, provider, timeoutMs = 120000) {
  console.log(`[Background] Waiting for ${provider} to respond...`);
  
  // Wait 15 seconds for response to generate (was working before)
  await sleep(15000);
  
  console.log(`[Background] 15 seconds passed, attempting to extract response from ${provider}`);
  
  // Try extraction first without activating tab (might work for some AIs)
  let wasActivated = false;
  let lastError = null;
  
  // Try up to 5 times with delays
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`[Background] Extraction attempt ${attempt}/5 for ${provider}`);
      
      // On attempt 2, activate tab if first attempt failed (ChatGPT needs this)
      if (attempt === 2 && !wasActivated) {
        try {
          const tab = await chrome.tabs.get(tabId);
          if (!tab.active) {
            await chrome.tabs.update(tabId, { active: true });
            wasActivated = true;
            console.log(`[Background] Activated ${provider} tab for extraction (attempt ${attempt})`);
            await sleep(1000); // Brief wait for rendering
          }
        } catch (e) {
          console.warn(`[Background] Could not activate tab:`, e);
        }
      }
      
      const responseData = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_RESPONSE'
      });
      
      if (responseData && responseData.success && responseData.response) {
        const responseText = responseData.response.trim();
        // Reduced minimum length from 10 to 3 characters
        if (responseText.length >= 3) {
          console.log(`[Background] Got response from ${provider}, length:`, responseText.length);
          
          // Deactivate tab immediately after successful extraction
          if (wasActivated) {
            try {
              await chrome.tabs.update(tabId, { active: false });
              console.log(`[Background] Deactivated ${provider} tab after extraction`);
            } catch (e) {
              // Ignore errors
            }
          }
          
          return responseText;
        } else {
          console.warn(`[Background] Response too short (${responseText.length} chars), retrying...`);
          lastError = new Error('Response text too short');
        }
      } else {
        const errorMsg = responseData?.error || 'Unknown extraction error';
        console.warn(`[Background] Extraction failed: ${errorMsg}, retrying...`);
        lastError = new Error(errorMsg);
      }
      
      // Wait before retry
      if (attempt < 5) {
        await sleep(3000); // 3 seconds between retries
      }
      
    } catch (error) {
      console.error(`[Background] Error on attempt ${attempt}:`, error);
      lastError = error;
      if (attempt < 5) {
        await sleep(3000);
      }
    }
  }
  
  // Deactivate tab if we activated it
  if (wasActivated) {
    try {
      await chrome.tabs.update(tabId, { active: false });
      console.log(`[Background] Deactivated ${provider} tab after failed extraction`);
    } catch (e) {
      // Ignore errors
    }
  }
  
  // All attempts failed
  throw new Error(`Failed to get response from ${provider} after 5 attempts: ${lastError?.message || 'Unknown error'}`);
}

// Ensure AI tabs are open and registered
async function ensureAiTabs(selectedAis) {
  const urls = {
    chatgpt: 'https://chat.openai.com/',
    claude: 'https://claude.ai/',
    gemini: 'https://gemini.google.com/'
  };
  
  try {
    // Get all tabs
    const allTabs = await chrome.tabs.query({});
    
    for (const ai of selectedAis) {
      const aiUrl = urls[ai];
      const domain = new URL(aiUrl).hostname;
      
      // Check if tab already exists (check by hostname)
      const existingTab = allTabs.find(tab => {
        if (!tab.url) return false;
        try {
          const tabDomain = new URL(tab.url).hostname;
          return tabDomain === domain || tabDomain.endsWith(domain);
        } catch {
          return false;
        }
      });
      
      if (existingTab) {
        state.tabRegistry[ai] = existingTab.id;
        console.log(`[Background] Found existing tab for ${ai}:`, existingTab.id, existingTab.url);
        
        // Make sure tab is loaded - wait a bit
        await sleep(1000);
      } else {
        console.log(`[Background] No existing tab found for ${ai}, creating new one...`);
        // Create new tab in background (not active, not visible)
        const newTab = await chrome.tabs.create({ url: aiUrl, active: false });
        state.tabRegistry[ai] = newTab.id;
        console.log(`[Background] Created new tab for ${ai}:`, newTab.id);
        
        // Minimize/hide the tab immediately
        try {
          await chrome.tabs.update(newTab.id, { active: false });
        } catch (e) {
          console.log('[Background] Could not hide tab:', e);
        }
        
        // Wait for tab to load and content script to inject
        console.log(`[Background] Waiting 8 seconds for ${ai} to load...`);
        await sleep(8000); // Increased to 8s for new tabs
      }
    }
  } catch (error) {
    console.error('[Background] Error ensuring AI tabs:', error);
    throw new Error(`Failed to create/find AI tabs: ${error.message}`);
  }
}

// Verify AI tabs are ready
async function verifyAiTabsReady(selectedAis) {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds between retries
  
  for (const ai of selectedAis) {
    let tabId = state.tabRegistry[ai];
    
    // If no tab registered, try to find or create one
    if (!tabId) {
      console.log(`[Background] No tab registered for ${ai}, trying to find or create...`);
      try {
        tabId = await openOrCreateTab(ai);
      } catch (error) {
        console.error(`[Background] Failed to create tab for ${ai}:`, error);
        return false;
      }
    }
    
    // Retry checking readiness
    let isReady = false;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Background] Checking ${ai} readiness (attempt ${attempt}/${maxRetries})...`);
        const response = await chrome.tabs.sendMessage(tabId, { type: 'CHECK_READY' });
        
        if (response && response.ready) {
          console.log(`[Background] ${ai} is ready!`);
          isReady = true;
          break;
        } else {
          console.log(`[Background] ${ai} not ready yet, response:`, response);
        }
      } catch (error) {
        console.log(`[Background] Failed to check ${ai} readiness (attempt ${attempt}):`, error.message);
        
        // If it's a connection error, the content script might not be loaded yet
        if (error.message.includes('Receiving end does not exist')) {
          console.log(`[Background] Content script not loaded yet for ${ai}, waiting...`);
        }
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        await sleep(retryDelay);
      }
    }
    
    if (!isReady) {
      console.error(`[Background] ${ai} failed to become ready after ${maxRetries} attempts`);
      return false;
    }
  }
  
  console.log('[Background] All AIs are ready!');
  return true;
}

// Broadcast status to popup and side panel
function broadcastStatus(extra = {}) {
  const message = {
    type: 'STATUS_UPDATE',
    payload: {
      status: state.status,
      currentTurn: state.currentTurn,
      totalTurns: state.aiOrder.length * state.maxRounds,
      template: state.activeFlow,
      ...extra
    }
  };
  
  // Send to all extension pages
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup/sidepanel might not be open
  });
}

// Open or create tab for a specific AI
async function openOrCreateTab(aiProvider) {
  const urls = {
    chatgpt: 'https://chat.openai.com/',
    claude: 'https://claude.ai/',
    gemini: 'https://gemini.google.com/'
  };
  
  const url = urls[aiProvider];
  if (!url) {
    throw new Error(`Unknown AI provider: ${aiProvider}`);
  }
  
  // Check if tab already exists in registry
  let tabId = state.tabRegistry[aiProvider];
  
  if (tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url && (tab.url.startsWith(url) || tab.url.includes(new URL(url).hostname))) {
        console.log(`[Background] Found existing tab for ${aiProvider}: ${tabId}`);
        return tabId;
      } else {
        console.log(`[Background] Existing tab for ${aiProvider} is not valid, creating new one...`);
        delete state.tabRegistry[aiProvider];
        tabId = null;
      }
    } catch (e) {
      console.warn(`[Background] Error getting tab ${tabId} for ${aiProvider}, assuming it's gone:`, e);
      delete state.tabRegistry[aiProvider];
      tabId = null;
    }
  }
  
  // Check all tabs for existing one
  if (!tabId) {
    const allTabs = await chrome.tabs.query({});
    const domain = new URL(url).hostname;
    const existingTab = allTabs.find(tab => {
      if (!tab.url) return false;
      try {
        const tabDomain = new URL(tab.url).hostname;
        return tabDomain === domain || tabDomain.endsWith(domain);
      } catch {
        return false;
      }
    });
    
    if (existingTab) {
      tabId = existingTab.id;
      state.tabRegistry[aiProvider] = tabId;
      console.log(`[Background] Found existing tab for ${aiProvider}: ${tabId}`);
      await sleep(1000);
      return tabId;
    }
  }
  
  // Create new tab if none exists
  if (!tabId) {
    console.log(`[Background] No existing tab found for ${aiProvider}, creating new one...`);
    const newTab = await chrome.tabs.create({ url: url, active: false });
    state.tabRegistry[aiProvider] = newTab.id;
    console.log(`[Background] Created new tab for ${aiProvider}: ${newTab.id}`);
    
    // Wait for tab to load and content script to inject
    await sleep(8000);
    return newTab.id;
  }
  
  return tabId;
}

// Handle generate conclusion
async function handleGenerateConclusion(payload) {
  const { ai, prompt } = payload;
  
  if (!ai || !prompt) {
    throw new Error('Missing AI or prompt for conclusion');
  }
  
  console.log(`[Background] Generating conclusion with ${ai}...`);
  
  // Get or create tab for the AI
  const tabId = await openOrCreateTab(ai);
  
  try {
    // Wait a moment for tab to be ready
    await sleep(2000);
    
    // Verify AI is ready
    const readyResponse = await chrome.tabs.sendMessage(tabId, {
      type: 'CHECK_READY'
    });
    
    if (!readyResponse || !readyResponse.ready) {
      throw new Error(`${ai} is not ready. Please ensure you're logged in.`);
    }
    
    // Inject conclusion prompt
    const injectResponse = await chrome.tabs.sendMessage(tabId, {
      type: 'INJECT_PROMPT',
      payload: { prompt }
    });
    
    if (!injectResponse || !injectResponse.success) {
      throw new Error(`Failed to inject conclusion prompt into ${ai}: ${injectResponse?.error || 'Unknown error'}`);
    }
    
    // Tab stays in background - no need to activate it
    // Content scripts work fine in background tabs
    
    // Wait for response (30 seconds for conclusion)
    await sleep(30000);
    
    // Extract response
    let lastError = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        console.log(`[Background] Conclusion extraction attempt ${attempt}/5 for ${ai}`);
        
        const responseData = await chrome.tabs.sendMessage(tabId, {
          type: 'GET_RESPONSE'
        });
        
        if (responseData && responseData.success && responseData.response) {
          const responseText = responseData.response.trim();
          if (responseText.length >= 3) {
            console.log(`[Background] Got conclusion from ${ai}, length:`, responseText.length);
            
            // Tab stays in background - no need to deactivate
            
            return responseText;
          } else {
            lastError = new Error('Response text too short');
          }
        } else {
          const errorMsg = responseData?.error || 'Unknown extraction error';
          lastError = new Error(errorMsg);
        }
        
        if (attempt < 5) {
          await sleep(5000);
        }
        
      } catch (error) {
        console.error(`[Background] Error on attempt ${attempt}:`, error);
        lastError = error;
        if (attempt < 5) {
          await sleep(5000);
        }
      }
    }
    
    // Tab stays in background - no need to deactivate
    
    throw new Error(`Failed to get conclusion from ${ai} after 5 attempts: ${lastError?.message || 'Unknown error'}`);
    
  } catch (error) {
    console.error(`[Background] Conclusion generation error:`, error);
    throw error;
  }
}

// Save flow to history
async function saveFlowHistory() {
  const entry = {
    timestamp: Date.now(),
    template: state.activeFlow,
    topic: state.userTopic,
    turns: state.context.length,
    context: state.context
  };
  
  // Get existing history
  const result = await chrome.storage.local.get('history');
  const history = result.history || [];
  
  // Add new entry
  history.unshift(entry);
  
  // Keep only last 10
  if (history.length > 10) {
    history.splice(10);
  }
  
  // Save
  await chrome.storage.local.set({ history });
  console.log('[Background] Flow saved to history');
}

// Utility: sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Listen for tab closes to clean up registry
chrome.tabs.onRemoved.addListener((tabId) => {
  for (const [provider, registeredTabId] of Object.entries(state.tabRegistry)) {
    if (registeredTabId === tabId) {
      delete state.tabRegistry[provider];
      console.log(`[Background] Unregistered tab for ${provider}`);
    }
  }
});

console.log('[Background] Service worker initialized');
