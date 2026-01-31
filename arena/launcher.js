// Launcher - detects if in popup and opens in tab instead

if (window.location.href.includes('arena.html')) {
  // Check if we're in a popup (small window)
  if (window.innerWidth < 700 || window.innerHeight < 500) {
    // We're in a popup - open in a new tab instead
    chrome.tabs.create({ 
      url: chrome.runtime.getURL('arena/arena.html')
    });
    
    // Show message in popup
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 16px; padding: 20px; text-align: center; background: #0f172a; color: #e2e8f0;">
        <div style="font-size: 48px;">🎭</div>
        <div style="font-size: 18px; font-weight: 600;">Opening Arena in new tab...</div>
        <div style="font-size: 14px; color: #94a3b8;">Close this popup</div>
      </div>
    `;
  }
}
