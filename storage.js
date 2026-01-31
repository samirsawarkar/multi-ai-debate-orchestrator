// Chrome storage wrapper for extension state management

const StorageManager = {
  // Save custom template
  async saveTemplate(templateId, templateData) {
    const key = `template_${templateId}`;
    await chrome.storage.local.set({ [key]: templateData });
  },

  // Load custom template
  async loadTemplate(templateId) {
    const key = `template_${templateId}`;
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  },

  // Get all custom templates
  async getAllCustomTemplates() {
    const all = await chrome.storage.local.get(null);
    const templates = {};
    Object.keys(all).forEach(key => {
      if (key.startsWith('template_')) {
        templates[key.replace('template_', '')] = all[key];
      }
    });
    return templates;
  },

  // Save flow history entry
  async saveHistoryEntry(entry) {
    const history = await this.getHistory();
    history.unshift(entry);
    // Keep only last 10
    if (history.length > 10) {
      history.pop();
    }
    await chrome.storage.local.set({ history });
  },

  // Get flow history
  async getHistory() {
    const result = await chrome.storage.local.get('history');
    return result.history || [];
  },

  // Clear history
  async clearHistory() {
    await chrome.storage.local.remove('history');
  },

  // Save preferences
  async savePreferences(prefs) {
    await chrome.storage.local.set({ preferences: prefs });
  },

  // Load preferences
  async loadPreferences() {
    const result = await chrome.storage.local.get('preferences');
    return result.preferences || {
      defaultAiOrder: ['chatgpt', 'claude', 'gemini'],
      theme: 'light',
      autoAdvance: false
    };
  },

  // Tab registry: map tab IDs to AI providers
  async registerTab(tabId, provider) {
    const tabs = await this.getTabRegistry();
    tabs[tabId] = provider;
    await chrome.storage.local.set({ tabRegistry: tabs });
  },

  async unregisterTab(tabId) {
    const tabs = await this.getTabRegistry();
    delete tabs[tabId];
    await chrome.storage.local.set({ tabRegistry: tabs });
  },

  async getTabRegistry() {
    const result = await chrome.storage.local.get('tabRegistry');
    return result.tabRegistry || {};
  },

  async findTabByProvider(provider) {
    const registry = await this.getTabRegistry();
    for (const [tabId, prov] of Object.entries(registry)) {
      if (prov === provider) {
        return parseInt(tabId);
      }
    }
    return null;
  }
};

// Export for use in other modules
if (typeof StorageManager !== 'undefined') {
  // Available globally in extension context
}
