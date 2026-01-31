// Content script for ChatGPT (chat.openai.com / chatgpt.com)
// Handles prompt injection, send triggering, and response extraction

console.log('🎭 AI Orchestrator: ChatGPT content script loaded!');

const ChatGPTController = {
  provider: 'chatgpt',
  isReady: false,
  isResponding: false,
  lastResponseText: '',
  observer: null,

  // DOM selectors (updated as of Jan 2026 - may break)
  selectors: {
    // Main textarea for input (contenteditable div)
    textarea: '#prompt-textarea',
    // Alternative selector
    textareaAlt: 'div[contenteditable="true"]',
    // Send button
    sendButton: '#composer-submit-button',
    // Alternative send button
    sendButtonAlt: 'button[data-testid="send-button"]',
    // Response container
    responseContainer: '[data-testid^="conversation-turn-"]',
    // Latest response
    latestResponse: '[data-message-author-role="assistant"]',
    // Streaming indicator
    streamingIndicator: '.result-streaming'
  },

  init() {
    console.log('[ChatGPT Controller] Initializing...');
    this.checkReady();
    this.setupMessageListener();
    this.reportStatus();
  },

  checkReady() {
    const textarea = this.getTextarea();
    this.isReady = !!textarea;
    if (this.isReady) {
      console.log('[ChatGPT Controller] Ready');
    } else {
      console.log('[ChatGPT Controller] Not ready, textarea not found');
      // Retry in 2 seconds
      setTimeout(() => this.checkReady(), 2000);
    }
  },

  getTextarea() {
    return document.querySelector(this.selectors.textarea) || 
           document.querySelector(this.selectors.textareaAlt);
  },

  getSendButton() {
    // Try multiple selectors
    let btn = document.querySelector(this.selectors.sendButton);
    if (btn) {
      console.log('[ChatGPT Controller] Found send button via data-testid');
      return btn;
    }
    
    btn = document.querySelector(this.selectors.sendButtonAlt);
    if (btn) {
      console.log('[ChatGPT Controller] Found send button via aria-label');
      return btn;
    }
    
    // Find button near the textarea (should be the send button)
    const textarea = this.getTextarea();
    if (textarea) {
      // Look for parent form and find button inside it
      const form = textarea.closest('form');
      if (form) {
        const buttons = Array.from(form.querySelectorAll('button[type="button"], button:not([type])'));
        // Filter out voice button, find send button
        const sendBtn = buttons.find(b => {
          const ariaLabel = b.getAttribute('aria-label');
          // Skip voice/microphone button
          if (ariaLabel && (ariaLabel.includes('Voice') || ariaLabel.includes('voice'))) {
            return false;
          }
          // Look for send-related labels or take last button
          return true;
        });
        
        if (sendBtn) {
          console.log('[ChatGPT Controller] Found send button in form:', sendBtn);
          return sendBtn;
        }
      }
    }
    
    // Last resort: find by aria-label containing "send"
    const buttons = Array.from(document.querySelectorAll('button'));
    btn = buttons.find(b => {
      const ariaLabel = b.getAttribute('aria-label');
      return ariaLabel && ariaLabel.toLowerCase().includes('send');
    });
    
    console.log('[ChatGPT Controller] Send button search result:', btn);
    return btn;
  },

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[ChatGPT Controller] Received message:', message.type);
      
      if (message.type === 'INJECT_PROMPT') {
        this.injectPrompt(message.payload.prompt)
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
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
    console.log('[ChatGPT Controller] injectPrompt called with:', prompt.substring(0, 100) + '...');
    
    if (!this.isReady) {
      console.error('[ChatGPT Controller] Not ready!');
      throw new Error('ChatGPT not ready');
    }

    const textarea = this.getTextarea();
    console.log('[ChatGPT Controller] Textarea found:', !!textarea);
    if (!textarea) {
      throw new Error('Textarea not found');
    }

    // Clear existing text
    textarea.innerHTML = '';
    
    // Insert new prompt into contenteditable div
    // Create a <p> tag with the text
    const p = document.createElement('p');
    p.textContent = prompt;
    textarea.appendChild(p);
    
    // Dispatch multiple events to make sure ChatGPT detects the change
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.focus();
    
    console.log('[ChatGPT Controller] Text inserted, length:', prompt.length);

    // Wait for UI to update and button to change from voice to send
    // ChatGPT needs time to switch from microphone to send button
    await this.sleep(1500); // Increased from 500ms to 1500ms

    // Click send button
    const sendButton = this.getSendButton();
    console.log('[ChatGPT Controller] Send button found:', !!sendButton);
    if (!sendButton) {
      throw new Error('Send button not found');
    }

    console.log('[ChatGPT Controller] Send button disabled?', sendButton.disabled);
    if (sendButton.disabled) {
      throw new Error('Send button is disabled');
    }

    console.log('[ChatGPT Controller] Clicking send button...');
    sendButton.click();
    this.isResponding = true;
    this.reportStatus();

    console.log('[ChatGPT Controller] Prompt injected and sent successfully!');
  },

  async waitForResponse(timeoutMs = 120000) {
    console.log('[ChatGPT Controller] Waiting 10 seconds for ChatGPT to respond...');
    
    // Just wait 10 seconds - simple!
    await this.sleep(10000);
    
    console.log('[ChatGPT Controller] 10 seconds passed, assuming response is ready');
    this.isResponding = false;
    this.reportStatus();
  },

  async extractResponse() {
    console.log('[ChatGPT Controller] Extracting response...');
    
    // Wait longer to ensure page is fully rendered (ChatGPT needs time in background tabs)
    await this.sleep(2000);
    
    // Scroll to bottom to ensure latest response is visible
    try {
      window.scrollTo(0, document.body.scrollHeight);
      await this.sleep(500);
    } catch (e) {
      console.warn('[ChatGPT Controller] Could not scroll:', e);
    }
    
    // Try multiple selectors to find assistant messages
    let responses = document.querySelectorAll('[data-message-author-role="assistant"]');
    console.log('[ChatGPT Controller] Found', responses.length, 'assistant messages via data-message-author-role');
    
    // Fallback selectors if first one fails
    if (responses.length === 0) {
      responses = document.querySelectorAll('[data-testid*="conversation-turn"] [data-message-author-role="assistant"]');
      console.log('[ChatGPT Controller] Found', responses.length, 'assistant messages via data-testid');
    }
    
    if (responses.length === 0) {
      // Try finding by class names
      responses = document.querySelectorAll('.group.w-full:has([data-message-author-role="assistant"])');
      console.log('[ChatGPT Controller] Found', responses.length, 'assistant messages via group class');
    }
    
    if (responses.length === 0) {
      // Last resort: find any div containing "assistant" in data attributes
      const allDivs = document.querySelectorAll('div[data-message-author-role]');
      responses = Array.from(allDivs).filter(div => div.getAttribute('data-message-author-role') === 'assistant');
      console.log('[ChatGPT Controller] Found', responses.length, 'assistant messages via fallback');
    }
    
    if (responses.length === 0) {
      // Debug: log what we can find
      console.error('[ChatGPT Controller] No assistant messages found. Available elements:');
      const testDivs = document.querySelectorAll('[data-message-author-role]');
      console.log('[ChatGPT Controller] Elements with data-message-author-role:', testDivs.length);
      testDivs.forEach((div, i) => {
        console.log(`[ChatGPT Controller] Element ${i}:`, div.getAttribute('data-message-author-role'), div.className);
      });
      throw new Error('No assistant response found. Make sure ChatGPT has responded.');
    }

    const latestResponse = responses[responses.length - 1];
    console.log('[ChatGPT Controller] Using latest response element:', latestResponse);
    
    // Check if still streaming
    const isStreaming = latestResponse.querySelector('.result-streaming, [class*="streaming"]');
    if (isStreaming) {
      console.warn('[ChatGPT Controller] Response appears to still be streaming, waiting 3 more seconds...');
      await this.sleep(3000);
    }
    
    // Try multiple ways to extract text
    let text = '';
    
    // Method 1: Look for markdown div
    const markdownDiv = latestResponse.querySelector('.markdown, [class*="markdown"], .prose, [class*="prose"]');
    if (markdownDiv) {
      text = markdownDiv.innerText || markdownDiv.textContent;
      console.log('[ChatGPT Controller] Extracted from markdown div, length:', text.length);
    }
    
    // Method 2: Look for message content div
    if (!text || text.length < 10) {
      const contentDiv = latestResponse.querySelector('[class*="message"], [class*="content"], [class*="text"]');
      if (contentDiv) {
        text = contentDiv.innerText || contentDiv.textContent;
        console.log('[ChatGPT Controller] Extracted from content div, length:', text.length);
      }
    }
    
    // Method 3: Get all text from the response element itself
    if (!text || text.length < 10) {
      text = latestResponse.innerText || latestResponse.textContent;
      console.log('[ChatGPT Controller] Extracted from response element directly, length:', text.length);
    }
    
    // Method 4: Try getting text from all child elements
    if (!text || text.length < 10) {
      const allTextElements = latestResponse.querySelectorAll('p, div, span, li');
      const textParts = Array.from(allTextElements)
        .map(el => (el.innerText || el.textContent || '').trim())
        .filter(t => t.length > 0 && !t.match(/^(Copy|Share|Regenerate|Good|Bad)/i));
      text = textParts.join(' ');
      console.log('[ChatGPT Controller] Extracted from child elements, length:', text.length);
    }
    
    // Clean up
    text = text.trim();
    
    // Remove UI artifacts
    text = text.replace(/^Copy\s*/gm, '');
    text = text.replace(/Good response|Bad response|Share|Regenerate|Continue/g, '');
    text = text.replace(/\s+/g, ' '); // Normalize whitespace
    
    // Scroll to latest response to ensure it's rendered
    try {
      latestResponse.scrollIntoView({ behavior: 'auto', block: 'center' });
      await this.sleep(1000); // Wait longer for scroll and rendering
    } catch (e) {
      console.warn('[ChatGPT Controller] Could not scroll to response:', e);
    }
    
    // Try extracting again after scroll (sometimes content loads after scroll)
    if (!text || text.length < 10) {
      await this.sleep(1000);
      const markdownDiv = latestResponse.querySelector('.markdown, [class*="markdown"], .prose, [class*="prose"]');
      if (markdownDiv) {
        text = markdownDiv.innerText || markdownDiv.textContent;
        console.log('[ChatGPT Controller] Re-extracted after scroll, length:', text.length);
      }
    }
    
    // Less strict check - allow very short responses (might be a single word answer)
    if (!text || text.length < 1) {
      console.error('[ChatGPT Controller] Extracted text is empty:', text);
      console.error('[ChatGPT Controller] Latest response element:', latestResponse);
      console.error('[ChatGPT Controller] Latest response HTML:', latestResponse.innerHTML.substring(0, 500));
      throw new Error('Response text is empty. ChatGPT may still be generating or response not found.');
    }
    
    // Warn if very short but don't fail
    if (text.length < 10) {
      console.warn('[ChatGPT Controller] Response is very short:', text.length, 'chars');
    }
    
    this.lastResponseText = text;
    console.log('[ChatGPT Controller] Response extracted successfully, length:', text.length);
    console.log('[ChatGPT Controller] First 200 chars:', text.substring(0, 200));
    
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
      console.warn('[ChatGPT Controller] Failed to report status:', err);
    });
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ChatGPTController.init());
} else {
  ChatGPTController.init();
}
