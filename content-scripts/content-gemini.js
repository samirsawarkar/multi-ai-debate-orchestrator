// Content script for Gemini (gemini.google.com)
// Handles prompt injection, send triggering, and response extraction

console.log('🎭 AI Orchestrator: Gemini content script loaded!');

const GeminiController = {
  provider: 'gemini',
  isReady: false,
  isResponding: false,
  lastResponseText: '',
  observer: null,

  // DOM selectors (updated as of Jan 2026 - may break)
  selectors: {
    // Main textarea for input
    textarea: 'rich-textarea[placeholder*="Enter"]',
    textareaAlt: 'div[contenteditable="true"][role="textbox"]',
    // Send button
    sendButton: 'button[aria-label*="Send"]',
    sendButtonAlt: 'button.send-button',
    // Response container
    responseContainer: '.conversation-container',
    // Latest response
    latestResponse: 'message-content[agent-type="model"]:last-of-type',
    // Streaming indicator
    streamingIndicator: '.streaming-indicator'
  },

  init() {
    console.log('[Gemini Controller] Initializing...');
    this.checkReady();
    this.setupMessageListener();
    this.reportStatus();
  },

  checkReady() {
    const textarea = this.getTextarea();
    this.isReady = !!textarea;
    if (this.isReady) {
      console.log('[Gemini Controller] Ready');
    } else {
      console.log('[Gemini Controller] Not ready, textarea not found');
      setTimeout(() => this.checkReady(), 2000);
    }
  },

  getTextarea() {
    // Try rich-textarea first
    let textarea = document.querySelector(this.selectors.textarea);
    if (textarea) {
      // Get the actual editable element inside
      const editable = textarea.querySelector('div[contenteditable="true"]');
      return editable || textarea;
    }
    
    // Try alternative selector
    return document.querySelector(this.selectors.textareaAlt);
  },

  getSendButton() {
    let btn = document.querySelector(this.selectors.sendButton);
    if (btn) return btn;
    
    // Look for button with send icon or text
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => {
      const ariaLabel = b.getAttribute('aria-label');
      const text = b.textContent;
      return (ariaLabel && ariaLabel.toLowerCase().includes('send')) ||
             (text && text.toLowerCase().includes('send'));
    });
  },

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[Gemini Controller] Received message:', message.type);
      
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
      throw new Error('Gemini not ready');
    }

    const textarea = this.getTextarea();
    if (!textarea) {
      throw new Error('Textarea not found');
    }

    // Clear and set content
    textarea.innerHTML = '';
    textarea.textContent = prompt;

    // Trigger events
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    await this.sleep(500);

    // Click send button
    const sendButton = this.getSendButton();
    if (!sendButton) {
      throw new Error('Send button not found');
    }

    if (sendButton.disabled || sendButton.getAttribute('aria-disabled') === 'true') {
      throw new Error('Send button is disabled');
    }

    sendButton.click();
    this.isResponding = true;
    this.reportStatus();

    console.log('[Gemini Controller] Prompt injected and sent');
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

        // Check for streaming indicator
        const streaming = document.querySelector(this.selectors.streamingIndicator);
        if (streaming) {
          return; // Still streaming
        }

        // Check if send button is enabled
        const sendButton = this.getSendButton();
        if (sendButton && !sendButton.disabled && sendButton.getAttribute('aria-disabled') !== 'true') {
          clearInterval(checkInterval);
          this.isResponding = false;
          this.reportStatus();
          resolve();
        }
      }, 1000);
    });
  },

  async extractResponse() {
    console.log('[Gemini Controller] Extracting response...');
    
    // Wait a moment to ensure page is fully rendered
    await this.sleep(1000);
    
    // Try multiple selectors to find response
    let responseElement = null;
    
    // Method 1: Look for message-content elements
    const messageContents = document.querySelectorAll('message-content');
    console.log('[Gemini Controller] Found', messageContents.length, 'message-content elements');
    
    if (messageContents.length > 0) {
      // Get the last one (most recent)
      responseElement = messageContents[messageContents.length - 1];
      console.log('[Gemini Controller] Using latest message-content element');
    }
    
    // Method 2: Look for markdown divs
    if (!responseElement) {
      const markdownDivs = document.querySelectorAll('.markdown, [class*="markdown"]');
      console.log('[Gemini Controller] Found', markdownDivs.length, 'markdown divs');
      
      if (markdownDivs.length > 0) {
        // Find the one that's inside a message-content or is a model response
        for (let i = markdownDivs.length - 1; i >= 0; i--) {
          const div = markdownDivs[i];
          const parent = div.closest('message-content');
          if (parent || div.id.includes('model-response')) {
            responseElement = div;
            console.log('[Gemini Controller] Using markdown div inside message-content');
            break;
          }
        }
      }
    }
    
    // Method 3: Look for divs with model-response in ID
    if (!responseElement) {
      const modelResponses = document.querySelectorAll('[id*="model-response"]');
      console.log('[Gemini Controller] Found', modelResponses.length, 'elements with model-response in ID');
      
      if (modelResponses.length > 0) {
        responseElement = modelResponses[modelResponses.length - 1];
        console.log('[Gemini Controller] Using element with model-response ID');
      }
    }
    
    // Method 4: Fallback - look for any div with markdown classes
    if (!responseElement) {
      const allMarkdown = document.querySelectorAll('.markdown-main-panel, [class*="markdown"]');
      console.log('[Gemini Controller] Found', allMarkdown.length, 'markdown elements (fallback)');
      
      if (allMarkdown.length > 0) {
        responseElement = allMarkdown[allMarkdown.length - 1];
        console.log('[Gemini Controller] Using last markdown element (fallback)');
      }
    }
    
    if (!responseElement) {
      // Debug: log what we can find
      console.error('[Gemini Controller] No response element found. Available elements:');
      const testElements = document.querySelectorAll('message-content, [class*="markdown"], [id*="response"]');
      console.log('[Gemini Controller] Found', testElements.length, 'potential response elements');
      testElements.forEach((el, i) => {
        console.log(`[Gemini Controller] Element ${i}:`, el.tagName, el.className, el.id);
      });
      throw new Error('No response found. Make sure Gemini has responded.');
    }
    
    console.log('[Gemini Controller] Response element found:', responseElement);
    
    // Check if still streaming (aria-busy attribute)
    const isStreaming = responseElement.getAttribute('aria-busy') === 'true' || 
                         responseElement.querySelector('[aria-busy="true"]');
    if (isStreaming) {
      console.warn('[Gemini Controller] Response appears to still be streaming, waiting 3 more seconds...');
      await this.sleep(3000);
    }
    
    // Scroll to response to ensure it's rendered
    try {
      responseElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      await this.sleep(500);
    } catch (e) {
      console.warn('[Gemini Controller] Could not scroll to response:', e);
    }
    
    // Extract text - try multiple methods
    let text = '';
    
    // Method 1: Get text from markdown div inside
    const markdownDiv = responseElement.querySelector('.markdown, [class*="markdown"]');
    if (markdownDiv) {
      text = markdownDiv.innerText || markdownDiv.textContent;
      console.log('[Gemini Controller] Extracted from markdown div, length:', text.length);
    }
    
    // Method 2: Get text directly from element
    if (!text || text.length < 10) {
      text = responseElement.innerText || responseElement.textContent;
      console.log('[Gemini Controller] Extracted from element directly, length:', text.length);
    }
    
    // Clean up
    text = text.trim();
    
    // Remove UI artifacts
    text = text.replace(/^Copy\s*/gm, '');
    text = text.replace(/^Share\s*/gm, '');
    text = text.replace(/\s+/g, ' '); // Normalize whitespace
    
    if (!text || text.length < 1) {
      console.error('[Gemini Controller] Extracted text is empty');
      console.error('[Gemini Controller] Response element HTML:', responseElement.innerHTML.substring(0, 500));
      throw new Error('Response text is empty. Gemini may still be generating or response not found.');
    }
    
    if (text.length < 10) {
      console.warn('[Gemini Controller] Response is very short:', text.length, 'chars');
    }
    
    this.lastResponseText = text;
    console.log('[Gemini Controller] Response extracted successfully, length:', text.length);
    console.log('[Gemini Controller] First 200 chars:', text.substring(0, 200));
    
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
      console.warn('[Gemini Controller] Failed to report status:', err);
    });
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GeminiController.init());
} else {
  GeminiController.init();
}
