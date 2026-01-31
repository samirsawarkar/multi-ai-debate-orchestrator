// Side panel logic for AI Orchestrator

// Import templates
const TEMPLATES = {
  brainstorm: {
    name: 'Brainstorm',
    description: 'Generate ideas, critique them, then synthesize improvements',
    ais: [
      { provider: 'chatgpt', role: 'Idea Generator', goal: 'Generate 5 diverse ideas', constraints: ['No evaluation', 'No filtering', 'Raw ideas only'], outputFormat: 'Numbered list' },
      { provider: 'claude', role: "Devil's Advocate", goal: 'Attack assumptions and find flaws', constraints: ['No solutions', 'No politeness', 'Bullet points only'], outputFormat: 'Critical analysis' },
      { provider: 'gemini', role: 'Synthesizer', goal: 'Improve ideas based on criticism', constraints: ['Address flaws', 'Rank by survivability'], outputFormat: 'Ranked list with reasoning' }
    ],
    maxRounds: 1
  },
  debate: {
    name: 'Debate',
    description: 'Two AIs debate a topic, third judges the winner',
    ais: [
      { provider: 'chatgpt', role: 'Advocate', goal: 'Defend the position strongly', constraints: ['Use evidence', 'Address counterarguments', 'Stay on topic'], outputFormat: 'Structured argument' },
      { provider: 'claude', role: 'Opponent', goal: 'Attack the position with counterarguments', constraints: ['Find weaknesses', 'Provide alternatives', 'Be rigorous'], outputFormat: 'Point-by-point rebuttal' },
      { provider: 'gemini', role: 'Judge', goal: 'Evaluate both arguments objectively', constraints: ['Identify strongest points', 'Spot logical flaws', 'Declare winner'], outputFormat: 'Verdict with reasoning' }
    ],
    maxRounds: 2
  },
  validation: {
    name: 'Validation',
    description: 'Propose solution, test edge cases, assess feasibility',
    ais: [
      { provider: 'chatgpt', role: 'Solution Designer', goal: 'Design a complete solution to the problem', constraints: ['Be specific', 'Include implementation details', 'Consider tradeoffs'], outputFormat: 'Detailed solution' },
      { provider: 'claude', role: 'Edge Case Analyst', goal: 'Find edge cases and failure scenarios', constraints: ['Think adversarially', 'Test boundaries', 'No mercy'], outputFormat: 'List of edge cases with severity' },
      { provider: 'gemini', role: 'Feasibility Assessor', goal: 'Evaluate if solution handles edge cases', constraints: ['Rate feasibility 1-10', 'Identify gaps', 'Suggest modifications'], outputFormat: 'Assessment with score' }
    ],
    maxRounds: 1
  },
  redteam: {
    name: 'Red Team',
    description: 'Security analysis through adversarial thinking',
    ais: [
      { provider: 'chatgpt', role: 'System Architect', goal: 'Describe the system architecture and security measures', constraints: ['Be thorough', 'Document assumptions', 'Explain defenses'], outputFormat: 'Architecture description' },
      { provider: 'claude', role: 'Attacker', goal: 'Find vulnerabilities and attack vectors', constraints: ['Think like a hacker', 'Exploit weaknesses', 'Chain attacks'], outputFormat: 'Attack scenarios' },
      { provider: 'gemini', role: 'Security Auditor', goal: 'Prioritize vulnerabilities and recommend fixes', constraints: ['Risk assessment', 'Practical remediation', 'Cost-benefit analysis'], outputFormat: 'Security report' }
    ],
    maxRounds: 1
  }
};

const UI = {
  aiConfigList: null,
  templateSelect: null,
  templatePreview: null,
  roleEditors: null,
  maxRoundsInput: null,
  autoAdvanceCheckbox: null,
  userTopicSide: null,
  startBtn: null,
  pauseBtn: null,
  nextTurnBtn: null,
  resetBtn: null,
  flowStatus: null,
  turnStatus: null,
  currentAiStatus: null,
  contextHistory: null,
  clearHistoryBtn: null,
  exportHistoryBtn: null
};

let currentState = {
  selectedAis: ['chatgpt', 'claude', 'gemini'],
  currentTemplate: 'brainstorm'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  loadState();
  attachEventListeners();
  updateUI();
  startStatusPolling();
});

function initUI() {
  UI.aiConfigList = document.getElementById('ai-config-list');
  UI.templateSelect = document.getElementById('template-select-side');
  UI.templatePreview = document.getElementById('template-preview');
  UI.roleEditors = document.getElementById('role-editors');
  UI.maxRoundsInput = document.getElementById('max-rounds');
  UI.autoAdvanceCheckbox = document.getElementById('auto-advance');
  UI.userTopicSide = document.getElementById('user-topic-side');
  UI.startBtn = document.getElementById('start-flow-side');
  UI.pauseBtn = document.getElementById('pause-flow-side');
  UI.nextTurnBtn = document.getElementById('next-turn-side');
  UI.resetBtn = document.getElementById('reset-flow-side');
  UI.flowStatus = document.getElementById('flow-status');
  UI.turnStatus = document.getElementById('turn-status');
  UI.currentAiStatus = document.getElementById('current-ai-status');
  UI.contextHistory = document.getElementById('context-history');
  UI.clearHistoryBtn = document.getElementById('clear-history-btn');
  UI.exportHistoryBtn = document.getElementById('export-history-btn');
  
  // Setup collapsible sections
  setupCollapsibles();
}

function setupCollapsibles() {
  const collapseButtons = document.querySelectorAll('.collapse-btn');
  collapseButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const content = document.getElementById(targetId);
      const isExpanded = content.classList.contains('expanded');
      
      if (isExpanded) {
        content.classList.remove('expanded');
        btn.classList.add('collapsed');
      } else {
        content.classList.add('expanded');
        btn.classList.remove('collapsed');
      }
    });
  });
}

async function loadState() {
  const result = await chrome.storage.local.get(['selectedAis', 'lastTemplate']);
  if (result.selectedAis) {
    currentState.selectedAis = result.selectedAis;
  }
  if (result.lastTemplate) {
    currentState.currentTemplate = result.lastTemplate;
    UI.templateSelect.value = result.lastTemplate;
  }
}

async function saveState() {
  await chrome.storage.local.set({
    selectedAis: currentState.selectedAis,
    lastTemplate: currentState.currentTemplate
  });
}

function attachEventListeners() {
  UI.templateSelect.addEventListener('change', handleTemplateChange);
  UI.startBtn.addEventListener('click', handleStartFlow);
  UI.pauseBtn.addEventListener('click', handlePauseFlow);
  UI.nextTurnBtn.addEventListener('click', handleNextTurn);
  UI.resetBtn.addEventListener('click', handleReset);
  UI.clearHistoryBtn.addEventListener('click', handleClearHistory);
  UI.exportHistoryBtn.addEventListener('click', handleExportHistory);
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATUS_UPDATE') {
      updateStatus(message.payload);
    }
  });
}

function updateUI() {
  renderAiConfig();
  renderTemplatePreview();
  renderRoleEditors();
}

function renderAiConfig() {
  const aiProviders = ['chatgpt', 'claude', 'gemini'];
  UI.aiConfigList.innerHTML = aiProviders.map(provider => `
    <div class="ai-config-item">
      <input type="checkbox" id="ai-${provider}-side" value="${provider}" 
        ${currentState.selectedAis.includes(provider) ? 'checked' : ''}>
      <label for="ai-${provider}-side">${capitalizeFirst(provider)}</label>
    </div>
  `).join('');
  
  // Attach listeners
  aiProviders.forEach(provider => {
    document.getElementById(`ai-${provider}-side`).addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!currentState.selectedAis.includes(provider)) {
          currentState.selectedAis.push(provider);
        }
      } else {
        currentState.selectedAis = currentState.selectedAis.filter(ai => ai !== provider);
      }
      saveState();
      updateUI();
    });
  });
}

function renderTemplatePreview() {
  const template = TEMPLATES[currentState.currentTemplate];
  if (!template) return;
  
  UI.templatePreview.innerHTML = `
    <p style="margin-bottom: 12px; color: #64748b;">${template.description}</p>
    ${template.ais.map((ai, idx) => `
      <div class="role-item">
        <div class="role-name">${idx + 1}. ${ai.role} (${capitalizeFirst(ai.provider)})</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${ai.goal}</div>
      </div>
    `).join('')}
  `;
}

function renderRoleEditors() {
  const template = TEMPLATES[currentState.currentTemplate];
  if (!template) return;
  
  const filteredAis = template.ais.filter(ai => currentState.selectedAis.includes(ai.provider));
  
  UI.roleEditors.innerHTML = filteredAis.map((ai, idx) => `
    <div class="role-editor-item">
      <h3>${capitalizeFirst(ai.provider)}</h3>
      <label>Role:</label>
      <input type="text" value="${ai.role}" data-ai="${idx}" data-field="role">
      <label>Goal:</label>
      <textarea data-ai="${idx}" data-field="goal">${ai.goal}</textarea>
      <label>Constraints (comma-separated):</label>
      <textarea data-ai="${idx}" data-field="constraints">${ai.constraints.join(', ')}</textarea>
      <label>Output Format:</label>
      <input type="text" value="${ai.outputFormat}" data-ai="${idx}" data-field="outputFormat">
    </div>
  `).join('');
}

function handleTemplateChange() {
  currentState.currentTemplate = UI.templateSelect.value;
  const template = TEMPLATES[currentState.currentTemplate];
  UI.maxRoundsInput.value = template.maxRounds;
  saveState();
  updateUI();
}

async function handleStartFlow() {
  if (currentState.selectedAis.length === 0) {
    alert('Please select at least one AI');
    return;
  }
  
  const topic = UI.userTopicSide.value.trim();
  if (!topic) {
    alert('Please enter a topic or problem');
    return;
  }
  
  chrome.runtime.sendMessage({
    type: 'START_FLOW',
    payload: {
      selectedAis: currentState.selectedAis,
      template: currentState.currentTemplate,
      topic
    }
  });
}

function handlePauseFlow() {
  chrome.runtime.sendMessage({ type: 'STOP_FLOW' });
}

function handleNextTurn() {
  chrome.runtime.sendMessage({ type: 'NEXT_TURN' });
}

function handleReset() {
  chrome.runtime.sendMessage({ type: 'STOP_FLOW' });
  UI.contextHistory.innerHTML = '<p class="empty-state">No conversation history yet</p>';
  UI.flowStatus.textContent = 'Idle';
  UI.turnStatus.textContent = '-';
  UI.currentAiStatus.textContent = '-';
}

async function handleClearHistory() {
  if (confirm('Clear all context history?')) {
    UI.contextHistory.innerHTML = '<p class="empty-state">No conversation history yet</p>';
  }
}

function handleExportHistory() {
  const cards = UI.contextHistory.querySelectorAll('.context-card');
  if (cards.length === 0) {
    alert('No history to export');
    return;
  }
  
  let exportText = 'AI Orchestrator - Flow History\n';
  exportText += '='.repeat(50) + '\n\n';
  
  cards.forEach((card, idx) => {
    const title = card.querySelector('.context-card-title').textContent;
    const content = card.querySelector('.context-card-content').textContent;
    exportText += `${idx + 1}. ${title}\n${'-'.repeat(50)}\n${content}\n\n`;
  });
  
  // Download as text file
  const blob = new Blob([exportText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-orchestrator-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function updateStatus(payload) {
  const { status, currentTurn, totalTurns, aiName, role, error } = payload;
  
  UI.flowStatus.textContent = capitalizeFirst(status);
  
  if (status === 'running') {
    UI.turnStatus.textContent = `${currentTurn}/${totalTurns}`;
    UI.currentAiStatus.textContent = aiName ? `${capitalizeFirst(aiName)} - ${role}` : '-';
    UI.startBtn.disabled = true;
    UI.pauseBtn.disabled = false;
    UI.nextTurnBtn.disabled = true;
  } else if (status === 'complete') {
    UI.turnStatus.textContent = 'Complete';
    UI.currentAiStatus.textContent = '-';
    UI.startBtn.disabled = false;
    UI.pauseBtn.disabled = true;
    UI.nextTurnBtn.disabled = true;
    loadContextHistory();
  } else if (status === 'error') {
    UI.flowStatus.textContent = `Error: ${error}`;
    UI.startBtn.disabled = false;
    UI.pauseBtn.disabled = true;
  } else {
    UI.turnStatus.textContent = '-';
    UI.currentAiStatus.textContent = '-';
    UI.startBtn.disabled = false;
    UI.pauseBtn.disabled = true;
  }
}

async function loadContextHistory() {
  // Get state from background
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    if (response && response.state && response.state.context.length > 0) {
      renderContextHistory(response.state.context);
    }
  });
}

function renderContextHistory(context) {
  UI.contextHistory.innerHTML = context.map((item, idx) => `
    <div class="context-card">
      <div class="context-card-header">
        <div class="context-card-title">Turn ${item.turn + 1}: ${item.role}</div>
        <div class="context-card-meta">${capitalizeFirst(item.ai)}</div>
      </div>
      <div class="context-card-content">${item.output}</div>
      <div class="context-card-actions">
        <button class="copy-btn" data-idx="${idx}">Copy</button>
      </div>
    </div>
  `).join('');
  
  // Attach copy handlers
  UI.contextHistory.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-idx');
      const text = context[idx].output;
      navigator.clipboard.writeText(text);
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 2000);
    });
  });
}

function startStatusPolling() {
  // Poll for status updates every 2 seconds
  setInterval(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (response && response.state) {
        const state = response.state;
        if (state.status !== 'idle') {
          updateStatus({
            status: state.status,
            currentTurn: state.currentTurn + 1,
            totalTurns: state.aiOrder.length * state.maxRounds,
            aiName: state.aiOrder[state.currentTurn % state.aiOrder.length]?.provider,
            role: state.aiOrder[state.currentTurn % state.aiOrder.length]?.role
          });
        }
        
        if (state.context.length > 0) {
          renderContextHistory(state.context);
        }
      }
    });
  }, 2000);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
