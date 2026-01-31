// Arena UI - Full-page debate view

const ArenaUI = {
  setupPanel: null,
  conversationView: null,
  messagesContainer: null,
  statusText: null,
  turnCounter: null,
  currentAiElement: null
};

const aiColors = {
  chatgpt: '#10a37f',
  claude: '#cc785c',
  gemini: '#4285f4'
};

const aiNames = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  attachListeners();
  loadExistingMessages(); // Load any messages from previous flow
});

function initUI() {
  ArenaUI.setupPanel = document.getElementById('setup-panel');
  ArenaUI.conversationView = document.getElementById('conversation-view');
  ArenaUI.messagesContainer = document.getElementById('messages-container');
  ArenaUI.statusText = document.getElementById('status-text');
  ArenaUI.turnCounter = document.getElementById('turn-counter');
  ArenaUI.currentAiElement = document.getElementById('current-ai');
  ArenaUI.conclusionBtn = document.getElementById('conclusion-btn');
}

function attachListeners() {
  document.getElementById('start-debate-btn').addEventListener('click', handleStartDebate);
  document.getElementById('new-debate-btn').addEventListener('click', handleNewDebate);
  ArenaUI.conclusionBtn.addEventListener('click', handleGenerateConclusion);
  
  // Listen for updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATUS_UPDATE') {
      handleStatusUpdate(message.payload);
    }
  });
  
  // Poll for state updates
  startStatePolling();
}

async function handleStartDebate() {
  // Get selected AIs
  const selectedAis = Array.from(document.querySelectorAll('.ai-card input:checked'))
    .map(cb => cb.value);
  
  if (selectedAis.length < 2) {
    alert('Please select at least 2 AIs');
    return;
  }
  
  const template = document.getElementById('template-select-arena').value;
  const topic = document.getElementById('topic-input-arena').value.trim();
  
  if (!topic) {
    alert('Please enter a topic');
    return;
  }
  
  // Switch to conversation view
  ArenaUI.setupPanel.style.display = 'none';
  ArenaUI.conversationView.style.display = 'flex';
  
  // Clear messages
  ArenaUI.messagesContainer.innerHTML = '';
  
  // Add initial message
  addSystemMessage(`Starting ${template} debate with ${selectedAis.length} AIs...`);
  
  // Start flow
  try {
    await chrome.runtime.sendMessage({
      type: 'START_FLOW',
      payload: { selectedAis, template, topic }
    });
  } catch (error) {
    addSystemMessage(`Error: ${error.message}`, 'error');
  }
}

function handleNewDebate() {
  ArenaUI.setupPanel.style.display = 'block';
  ArenaUI.conversationView.style.display = 'none';
}

function handleStatusUpdate(payload) {
  const { status, currentTurn, totalTurns, aiName, role } = payload;
  
  if (status === 'running') {
    ArenaUI.statusText.textContent = `${aiName} is thinking...`;
    ArenaUI.turnCounter.textContent = `Turn ${currentTurn}/${totalTurns}`;
    ArenaUI.currentAiElement.textContent = role || aiName;
    
    // Show typing indicator
    showTypingIndicator(aiName, role);
  } else if (status === 'complete') {
    ArenaUI.statusText.textContent = 'Debate complete!';
    removeTypingIndicator();
    // Show conclusion button when debate is complete
    ArenaUI.conclusionBtn.style.display = 'block';
  } else if (status === 'error') {
    ArenaUI.statusText.textContent = `Error: ${payload.error}`;
    addSystemMessage(`Error: ${payload.error}`, 'error');
  }
}

function addSystemMessage(text, type = 'info') {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message system-message';
  msgDiv.innerHTML = `
    <div class="message-content" style="margin-left: 0; background: ${type === 'error' ? '#7f1d1d' : '#334155'}">
      ${text}
    </div>
  `;
  ArenaUI.messagesContainer.appendChild(msgDiv);
  scrollToBottom();
}

function showTypingIndicator(aiName, role) {
  // Remove existing typing indicator
  removeTypingIndicator();
  
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message typing-message';
  msgDiv.id = 'typing-indicator';
  msgDiv.innerHTML = `
    <div class="message-header">
      <div class="message-avatar" style="background: ${aiColors[aiName]}">
        ${aiName.substring(0, 1).toUpperCase()}
      </div>
      <div class="message-info">
        <div class="message-name">${aiNames[aiName]}</div>
        <div class="message-role">${role}</div>
      </div>
    </div>
    <div class="message-typing">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  ArenaUI.messagesContainer.appendChild(msgDiv);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

function addAIMessage(aiName, role, content) {
  // Remove typing indicator
  removeTypingIndicator();
  
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message';
  msgDiv.innerHTML = `
    <div class="message-header">
      <div class="message-avatar" style="background: ${aiColors[aiName]}">
        ${aiName.substring(0, 1).toUpperCase()}
      </div>
      <div class="message-info">
        <div class="message-name">${aiNames[aiName]}</div>
        <div class="message-role">${role}</div>
      </div>
    </div>
    <div class="message-content">${content}</div>
  `;
  ArenaUI.messagesContainer.appendChild(msgDiv);
  scrollToBottom();
}

function scrollToBottom() {
  // Smooth scroll to bottom
  ArenaUI.messagesContainer.scrollTo({
    top: ArenaUI.messagesContainer.scrollHeight,
    behavior: 'smooth'
  });
}

async function handleGenerateConclusion() {
  // Disable button
  ArenaUI.conclusionBtn.disabled = true;
  ArenaUI.conclusionBtn.textContent = 'Generating...';
  
  try {
    // Get all conversation context
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    if (!response || !response.state || !response.state.context) {
      throw new Error('No conversation found');
    }
    
    const context = response.state.context;
    if (context.length === 0) {
      throw new Error('No messages to summarize');
    }
    
    // Get selected AIs from state
    const selectedAis = response.state.selectedAis || ['chatgpt', 'claude', 'gemini'];
    
    // Use the first AI for conclusion (or let user choose)
    const conclusionAi = selectedAis[0];
    
    // Show typing indicator
    showTypingIndicator(conclusionAi, 'Synthesizer');
    ArenaUI.statusText.textContent = `${aiNames[conclusionAi]} is generating conclusion...`;
    
    // Build conversation summary
    let conversationText = 'CONVERSATION SUMMARY:\n\n';
    context.forEach((msg, index) => {
      conversationText += `[${msg.ai.toUpperCase()} - ${msg.role}]:\n${msg.output}\n\n`;
    });
    
    // Create conclusion prompt
    const conclusionPrompt = `You are a Synthesizer and Judge. Your task is to provide a comprehensive conclusion based on the following conversation between multiple AI models.

${conversationText}

Please provide:
1. A summary of the key points discussed
2. The main arguments and counterarguments
3. Areas of agreement and disagreement
4. Your final assessment or recommendation
5. Any important insights or takeaways

Format your response clearly with sections and bullet points where appropriate.`;

    // Send conclusion request to background
    const result = await chrome.runtime.sendMessage({
      type: 'GENERATE_CONCLUSION',
      payload: {
        ai: conclusionAi,
        prompt: conclusionPrompt
      }
    });
    
    if (result && result.success) {
      // Remove typing indicator
      removeTypingIndicator();
      
      // Add conclusion message
      addAIMessage(conclusionAi, 'Synthesizer', result.response);
      addSystemMessage('Conclusion generated successfully!');
      
      // Hide button
      ArenaUI.conclusionBtn.style.display = 'none';
      ArenaUI.statusText.textContent = 'Conclusion complete!';
    } else {
      throw new Error(result?.error || 'Failed to generate conclusion');
    }
    
  } catch (error) {
    console.error('[Arena] Conclusion error:', error);
    removeTypingIndicator();
    addSystemMessage(`Error generating conclusion: ${error.message}`, 'error');
    ArenaUI.conclusionBtn.disabled = false;
    ArenaUI.conclusionBtn.textContent = '📝 Generate Conclusion';
    ArenaUI.statusText.textContent = 'Error generating conclusion';
  }
}

// Load existing messages from background state
async function loadExistingMessages() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    console.log('[Arena] Loading existing messages:', response);
    
    if (response && response.state && response.state.context) {
      const context = response.state.context;
      console.log('[Arena] Found', context.length, 'existing messages');
      
      if (context.length > 0) {
        // Show conversation view if there are messages
        ArenaUI.setupPanel.style.display = 'none';
        ArenaUI.conversationView.style.display = 'flex';
        
        // Add all messages
        context.forEach(msg => {
          addAIMessage(msg.ai, msg.role, msg.output);
        });
        
        addSystemMessage('Loaded previous conversation');
      }
    }
  } catch (error) {
    console.error('[Arena] Failed to load existing messages:', error);
  }
}

// Poll for state and update messages
function startStatePolling() {
  let lastContextLength = 0;
  
  const pollInterval = setInterval(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
      console.log('[Arena] State poll response:', response);
      
      if (response && response.state) {
        const context = response.state.context || [];
        console.log('[Arena] Context length:', context.length, 'Last:', lastContextLength);
        
        // Add new messages
        if (context.length > lastContextLength) {
          console.log('[Arena] Adding new messages:', context.length - lastContextLength);
          for (let i = lastContextLength; i < context.length; i++) {
            const msg = context[i];
            console.log('[Arena] Adding message:', msg);
            addAIMessage(msg.ai, msg.role, msg.output);
          }
          lastContextLength = context.length;
        }
        
        // Update status
        if (response.state.status === 'complete' && context.length > 0) {
          ArenaUI.statusText.textContent = 'Debate complete!';
          removeTypingIndicator();
          // Show conclusion button when debate is complete
          ArenaUI.conclusionBtn.style.display = 'block';
          clearInterval(pollInterval);
        }
      }
    } catch (error) {
      console.error('[Arena] Poll error:', error);
    }
  }, 2000);
}
