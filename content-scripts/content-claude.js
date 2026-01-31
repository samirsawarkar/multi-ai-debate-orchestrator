// Content script for Claude (claude.ai)
// Handles prompt injection, send triggering, and response extraction

console.log('🎭 AI Orchestrator: Claude content script loaded!');

const ClaudeController = {
  provider: 'claude',
  isReady: false,
  isResponding: false,
  lastResponseText: '',
  observer: null,

  // DOM selectors (updated as of Jan 2026 - may break)
  selectors: {
    // Main textarea/contenteditable for input
    textarea: 'div[contenteditable="true"][data-placeholder]',
    textareaAlt: 'div[contenteditable="true"]',
    // Send button
    sendButton: 'button[aria-label*="Send"]',
    sendButtonAlt: 'button:has(svg[data-icon="send"])',
    // Response container
    responseContainer: 'div[data-test-render-count]',
    // Latest response
    latestResponse: 'div[data-test-render-count] > div:last-child',
    // Stop button (indicates streaming)
    stopButton: 'button[aria-label="Stop generating"]'
  },

  init() {
    console.log('[Claude Controller] Initializing...');
    this.checkReady();
    this.setupMessageListener();
    this.reportStatus();
  },

  checkReady() {
    const textarea = this.getTextarea();
    this.isReady = !!textarea;
    if (this.isReady) {
      console.log('[Claude Controller] Ready');
    } else {
      console.log('[Claude Controller] Not ready, textarea not found');
      setTimeout(() => this.checkReady(), 2000);
    }
  },

  getTextarea() {
    const textarea = document.querySelector(this.selectors.textarea) || 
                     document.querySelector(this.selectors.textareaAlt);
    // Verify it's actually an input field (not a response div)
    if (textarea && textarea.getAttribute('contenteditable') === 'true') {
      return textarea;
    }
    return null;
  },

  getSendButton() {
    // Try multiple selectors
    let btn = document.querySelector(this.selectors.sendButton);
    if (btn) return btn;
    
    // Look for button with send icon
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => {
      const ariaLabel = b.getAttribute('aria-label');
      return ariaLabel && ariaLabel.toLowerCase().includes('send');
    });
  },

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[Claude Controller] Received message:', message.type);
      
      if (message.type === 'INJECT_PROMPT') {
        this.injectPrompt(message.payload.prompt)
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      }
      
      if (message.type === 'GET_RESPONSE') {
        this.extractResponse()
          .then(response => sendResponse({ success: true, response }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      }
      
      if (message.type === 'CHECK_READY') {
        sendResponse({ ready: this.isReady, responding: this.isResponding });
      }
    });
  },

  async injectPrompt(prompt) {
    if (!this.isReady) {
      throw new Error('Claude not ready');
    }

    const textarea = this.getTextarea();
    if (!textarea) {
      throw new Error('Textarea not found');
    }

    // Clear existing text
    textarea.innerHTML = '';
    textarea.textContent = '';

    // Insert new prompt (contenteditable uses textContent)
    textarea.textContent = prompt;

    // Trigger input events
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    await this.sleep(500);

    // Click send button
    const sendButton = this.getSendButton();
    if (!sendButton) {
      throw new Error('Send button not found');
    }

    if (sendButton.disabled) {
      throw new Error('Send button is disabled');
    }

    sendButton.click();
    this.isResponding = true;
    this.reportStatus();

    console.log('[Claude Controller] Prompt injected and sent');
  },

  async waitForResponse(timeoutMs = 120000) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          this.isResponding = false;
          this.reportStatus();
          reject(new Error('Response timeout'));
          return;
        }

        // Check if stop button exists (still streaming)
        const stopButton = document.querySelector(this.selectors.stopButton);
        if (stopButton) {
          return; // Still streaming
        }

        // Check if send button is enabled again
        const sendButton = this.getSendButton();
        if (sendButton && !sendButton.disabled) {
          clearInterval(checkInterval);
          this.isResponding = false;
          this.reportStatus();
          resolve();
        }
      }, 1000);
    });
  },

  async extractResponse() {
    console.log('[Claude Controller] Extracting response...');
    
    // Wait a moment to ensure page is fully rendered
    await this.sleep(1000);
    
    // Get the textarea to exclude it and any elements containing the prompt
    const textarea = this.getTextarea();
    const promptText = textarea ? (textarea.innerText || textarea.textContent || '').trim() : '';
    
    // Try multiple selectors to find ASSISTANT response (not user prompt)
    let responseElement = null;
    
    // Method 1: Look for standard-markdown divs (Claude's response format)
    const markdownDivs = document.querySelectorAll('.standard-markdown, [class*="standard-markdown"]');
    console.log('[Claude Controller] Found', markdownDivs.length, 'standard-markdown divs');
    
    if (markdownDivs.length > 0) {
      // Get the last one (most recent response)
      // Make sure it's not the prompt we just sent
      for (let i = markdownDivs.length - 1; i >= 0; i--) {
        const div = markdownDivs[i];
        const divText = (div.innerText || div.textContent || '').trim();
        
        // Skip if this contains our prompt text
        if (promptText && divText.includes(promptText.substring(0, 50))) {
          console.log('[Claude Controller] Skipping div that contains prompt text');
          continue;
        }
        
        // This should be Claude's response
        responseElement = div;
        console.log('[Claude Controller] Using standard-markdown div (assistant response)');
        break;
      }
    }
    
    // Method 2: Look for assistant message blocks (not user messages)
    if (!responseElement) {
      // Look for elements that indicate assistant/Claude messages
      const assistantIndicators = document.querySelectorAll(
        '[data-author="assistant"], ' +
        '[data-author="claude"], ' +
        '[class*="assistant"], ' +
        '[class*="Assistant"], ' +
        '[class*="claude"], ' +
        '[class*="Claude"]'
      );
      
      console.log('[Claude Controller] Found', assistantIndicators.length, 'assistant indicator elements');
      
      if (assistantIndicators.length > 0) {
        // Get the last assistant message
        responseElement = assistantIndicators[assistantIndicators.length - 1];
        console.log('[Claude Controller] Using assistant indicator element');
      }
    }
    
    // Method 3: Look for data-test-render-count container and find assistant messages
    if (!responseElement) {
      const responseContainer = document.querySelector(this.selectors.responseContainer);
      if (responseContainer) {
        const turns = Array.from(responseContainer.children);
        console.log('[Claude Controller] Found', turns.length, 'turns in response container');
        
        // Find the last turn that's NOT a user message
        for (let i = turns.length - 1; i >= 0; i--) {
          const turn = turns[i];
          const turnText = (turn.innerText || turn.textContent || '').trim();
          
          // Skip if this contains our prompt
          if (promptText && turnText.includes(promptText.substring(0, 50))) {
            console.log('[Claude Controller] Skipping turn that contains prompt');
            continue;
          }
          
          // Check if it's marked as user message
          const isUser = turn.querySelector('[data-author="user"], [class*="user-message"], [class*="UserMessage"]');
          if (!isUser && turnText.length > 10) {
            responseElement = turn;
            console.log('[Claude Controller] Using latest non-user turn from container');
            break;
          }
        }
      }
    }
    
    // Method 4: Look for divs with substantial text that are NOT the input and NOT the prompt
    if (!responseElement) {
      const allDivs = Array.from(document.querySelectorAll('div'));
      const candidateDivs = allDivs.filter(div => {
        // Exclude textarea and its parents
        if (textarea && (div === textarea || div.contains(textarea))) return false;
        
        // Exclude contenteditable elements (input fields)
        if (div.getAttribute('contenteditable') === 'true') return false;
        
        // Exclude if it contains input elements
        if (div.querySelector('input, textarea, [contenteditable="true"]')) return false;
        
        const text = (div.innerText || div.textContent || '').trim();
        
        // Skip if this is our prompt
        if (promptText && text.includes(promptText.substring(0, 50))) {
          return false;
        }
        
        // Should have substantial text
        return text.length > 50;
      });
      
      console.log('[Claude Controller] Found', candidateDivs.length, 'candidate response divs (excluding prompt)');
      
      if (candidateDivs.length > 0) {
        // Get the last one (most recent, should be the response)
        responseElement = candidateDivs[candidateDivs.length - 1];
        console.log('[Claude Controller] Using last candidate div (excluding prompt)');
      }
    }
    
    if (!responseElement) {
      // Debug: log what we can find
      console.error('[Claude Controller] No response element found. Available elements:');
      const testContainer = document.querySelector('[data-test-render-count]');
      if (testContainer) {
        console.log('[Claude Controller] Response container found:', testContainer);
        console.log('[Claude Controller] Container children:', testContainer.children.length);
      }
      const testMessages = document.querySelectorAll('[data-testid*="message"], [class*="Message"]');
      console.log('[Claude Controller] Message elements found:', testMessages.length);
      throw new Error('No response found. Make sure Claude has responded.');
    }
    
    console.log('[Claude Controller] Response element found:', responseElement);
    
    // Check if still streaming
    const stopButton = document.querySelector(this.selectors.stopButton);
    if (stopButton) {
      console.warn('[Claude Controller] Response appears to still be streaming, waiting 3 more seconds...');
      await this.sleep(3000);
    }
    
    // Scroll to response to ensure it's rendered
    try {
      responseElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      await this.sleep(500);
    } catch (e) {
      console.warn('[Claude Controller] Could not scroll to response:', e);
    }
    
    // Extract text - try multiple methods
    let text = '';
    
    // Method 1: Get text directly from element
    text = responseElement.innerText || responseElement.textContent;
    console.log('[Claude Controller] Extracted from element directly, length:', text.length);
    
    // Method 2: If too short, try finding text content inside
    if (text.length < 10) {
      const textNodes = responseElement.querySelectorAll('p, div, span');
      const allText = Array.from(textNodes)
        .map(node => (node.innerText || node.textContent || '').trim())
        .filter(t => t.length > 0)
        .join(' ');
      
      if (allText.length > text.length) {
        text = allText;
        console.log('[Claude Controller] Extracted from child elements, length:', text.length);
      }
    }
    
    // Clean up
    text = text.trim();
    
    // Remove UI artifacts
    text = text.replace(/^Copy\s*/gm, '');
    text = text.replace(/^Share\s*/gm, '');
    text = text.replace(/^Regenerate\s*/gm, '');
    text = text.replace(/\s+/g, ' '); // Normalize whitespace
    
    if (!text || text.length < 1) {
      console.error('[Claude Controller] Extracted text is empty');
      console.error('[Claude Controller] Response element HTML:', responseElement.innerHTML.substring(0, 500));
      throw new Error('Response text is empty. Claude may still be generating or response not found.');
    }
    
    if (text.length < 10) {
      console.warn('[Claude Controller] Response is very short:', text.length, 'chars');
    }
    
    this.lastResponseText = text;
    console.log('[Claude Controller] Response extracted successfully, length:', text.length);
    console.log('[Claude Controller] First 200 chars:', text.substring(0, 200));
    
    return text;
  },

  reportStatus() {
    chrome.runtime.sendMessage({
      type: 'CONTENT_STATUS',
      payload: {
        provider: this.provider,
        ready: this.isReady,
        responding: this.isResponding
      }
    }).catch(err => {
      console.warn('[Claude Controller] Failed to report status:', err);
    });
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ClaudeController.init());
} else {
  ClaudeController.init();
}
