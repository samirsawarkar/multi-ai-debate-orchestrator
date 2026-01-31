// Popup UI logic for AI Orchestrator

const UI = {
  aiCheckboxes: {
    chatgpt: null,
    claude: null,
    gemini: null
  },
  templateSelect: null,
  userTopic: null,
  startBtn: null,
  stopBtn: null,
  openSidepanelBtn: null,
  openTabsBtn: null,
  statusSection: null,
  statusText: null,
  currentTurn: null,
  statusDot: null
};

// Initialize UI references
document.addEventListener('DOMContentLoaded', () => {
  UI.aiCheckboxes.chatgpt = document.getElementById('ai-chatgpt');
  UI.aiCheckboxes.claude = document.getElementById('ai-claude');
  UI.aiCheckboxes.gemini = document.getElementById('ai-gemini');
  UI.templateSelect = document.getElementById('template-select');
  UI.userTopic = document.getElementById('user-topic');
  UI.startBtn = document.getElementById('start-flow');
  UI.stopBtn = document.getElementById('stop-flow');
  UI.openSidepanelBtn = document.getElementById('open-sidepanel');
  UI.openTabsBtn = document.getElementById('open-tabs');
  UI.statusSection = document.getElementById('status-section');
  UI.statusText = document.getElementById('status-text');
  UI.currentTurn = document.getElementById('current-turn');
  UI.statusDot = document.querySelector('.status-dot');

  loadState();
  attachEventListeners();
  updateStatus();
});

// Load saved state
async function loadState() {
  const result = await chrome.storage.local.get(['selectedAis', 'lastTemplate']);
  
  if (result.selectedAis) {
    result.selectedAis.forEach(ai => {
      if (UI.aiCheckboxes[ai]) {
        UI.aiCheckboxes[ai].checked = true;
      }
    });
  }
  
  if (result.lastTemplate) {
    UI.templateSelect.value = result.lastTemplate;
  }
}

// Save state
async function saveState() {
  const selectedAis = Object.keys(UI.aiCheckboxes)
    .filter(ai => UI.aiCheckboxes[ai].checked);
  
  await chrome.storage.local.set({
    selectedAis,
    lastTemplate: UI.templateSelect.value
  });
}

// Attach event listeners
function attachEventListeners() {
  UI.startBtn.addEventListener('click', handleStartFlow);
  UI.stopBtn.addEventListener('click', handleStopFlow);
  UI.openSidepanelBtn.addEventListener('click', handleOpenSidepanel);
  UI.openTabsBtn.addEventListener('click', handleOpenTabs);
  document.getElementById('test-connection').addEventListener('click', handleTestConnection);
  
  // Save state on changes
  Object.values(UI.aiCheckboxes).forEach(checkbox => {
    checkbox.addEventListener('change', saveState);
  });
  UI.templateSelect.addEventListener('change', saveState);
}

// Handle start flow
async function handleStartFlow() {
  const selectedAis = Object.keys(UI.aiCheckboxes)
    .filter(ai => UI.aiCheckboxes[ai].checked);
  
  console.log('[Popup] Selected AIs:', selectedAis);
  
  if (selectedAis.length === 0) {
    alert('Please select at least one AI');
    return;
  }
  
  const topic = UI.userTopic.value.trim();
  console.log('[Popup] Topic:', topic);
  
  if (!topic) {
    alert('Please enter a topic or problem');
    return;
  }
  
  const template = UI.templateSelect.value;
  console.log('[Popup] Template:', template);
  
  // Send message to background to start flow
  const message = {
    type: 'START_FLOW',
    payload: {
      selectedAis,
      template,
      topic
    }
  };
  
  console.log('[Popup] Sending message to background:', message);
  
  try {
    const response = await chrome.runtime.sendMessage(message);
    console.log('[Popup] Response from background:', response);
    
    if (!response) {
      const errorMsg = 'No response from background script. The service worker may have crashed. Try reloading the extension.';
      showStatus(errorMsg, 'error');
      alert(errorMsg);
      return;
    }
    
    if (!response.success) {
      const errorMsg = response.error || 'Unknown error - check background console at chrome://extensions/';
      console.error('[Popup] Flow failed:', errorMsg);
      showStatus(`Error: ${errorMsg}`, 'error');
      alert(`Flow failed to start:\n\n${errorMsg}\n\nTo debug:\n1. Go to chrome://extensions/\n2. Find "Multi-AI Debate Orchestrator"\n3. Click "service worker"\n4. Check console for errors`);
      return;
    }
    
    UI.startBtn.disabled = true;
    UI.stopBtn.disabled = false;
    showStatus('Starting flow...', 'active');
  } catch (error) {
    console.error('[Popup] Error sending message:', error);
    const errorMsg = `${error.message}\n\nPossible causes:\n- Service worker crashed (reload extension)\n- Not logged into AI sites\n- No AI tabs open`;
    showStatus(`Error: ${error.message}`, 'error');
    alert(errorMsg);
  }
}

// Handle stop flow
function handleStopFlow() {
  chrome.runtime.sendMessage({ type: 'STOP_FLOW' });
  
  UI.startBtn.disabled = false;
  UI.stopBtn.disabled = true;
  showStatus('Flow stopped', 'idle');
}

// Handle open side panel
async function handleOpenSidepanel() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
}

// Handle test connection
async function handleTestConnection() {
  showStatus('Testing connection...', 'active');
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    console.log('[Popup] Test response:', response);
    
    if (!response) {
      alert('❌ FAILED: No response from background\n\nThe service worker may have crashed.\n\n1. Go to chrome://extensions/\n2. Reload the extension\n3. Try again');
      showStatus('Connection failed', 'error');
      return;
    }
    
    if (!response.state) {
      alert('❌ FAILED: Invalid response\n\nResponse: ' + JSON.stringify(response));
      showStatus('Invalid response', 'error');
      return;
    }
    
    // Check if templates are loaded
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (resp) => {
      const hasTemplates = typeof TEMPLATES !== 'undefined';
      alert(`✅ SUCCESS: Background is responding!\n\nState status: ${resp.state.status}\nTab registry: ${Object.keys(resp.state.tabRegistry).length} tabs\n\nNow check background console at:\nchrome://extensions/ → service worker`);
      showStatus('Connection OK', 'idle');
    });
  } catch (error) {
    console.error('[Popup] Test failed:', error);
    alert(`❌ FAILED: ${error.message}\n\n1. Go to chrome://extensions/\n2. Reload the extension\n3. Click "service worker" to see errors`);
    showStatus('Test failed', 'error');
  }
}

// Handle open tabs
async function handleOpenTabs() {
  const urls = {
    chatgpt: 'https://chat.openai.com/',
    claude: 'https://claude.ai/',
    gemini: 'https://gemini.google.com/'
  };
  
  const selectedAis = Object.keys(UI.aiCheckboxes)
    .filter(ai => UI.aiCheckboxes[ai].checked);
  
  if (selectedAis.length === 0) {
    alert('Please select AIs first');
    return;
  }
  
  for (const ai of selectedAis) {
    await chrome.tabs.create({ url: urls[ai], active: false });
  }
}

// Show status
function showStatus(message, type = 'idle') {
  // Handle undefined/null messages
  if (!message || message === 'undefined') {
    message = 'Unknown error occurred. Check console for details.';
  }
  
  UI.statusSection.style.display = 'block';
  UI.statusText.textContent = message;
  
  UI.statusDot.classList.remove('active', 'error');
  if (type === 'active') {
    UI.statusDot.classList.add('active');
  } else if (type === 'error') {
    UI.statusDot.classList.add('error');
  }
  
  console.log('[Popup] Status shown:', message, type);
}

// Update status from background
async function updateStatus() {
  // Listen for status updates from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Popup] Received status update:', message);
    
    if (message.type === 'STATUS_UPDATE') {
      const { status, currentTurn, aiName, error } = message.payload;
      
      if (status === 'idle') {
        UI.startBtn.disabled = false;
        UI.stopBtn.disabled = true;
        showStatus('Ready', 'idle');
        UI.currentTurn.textContent = '';
      } else if (status === 'running') {
        UI.startBtn.disabled = true;
        UI.stopBtn.disabled = false;
        showStatus(`Running turn ${currentTurn}`, 'active');
        UI.currentTurn.textContent = `Current: ${aiName}`;
      } else if (status === 'complete') {
        UI.startBtn.disabled = false;
        UI.stopBtn.disabled = true;
        showStatus('Flow complete!', 'idle');
        UI.currentTurn.textContent = '';
      } else if (status === 'error') {
        UI.startBtn.disabled = false;
        UI.stopBtn.disabled = true;
        const errorMsg = error || 'Error occurred';
        showStatus(errorMsg, 'error');
        console.error('[Popup] Flow error:', errorMsg);
      }
    }
  });
}
