const toggle = document.getElementById('group-toggle');

// Load current state
chrome.storage.local.get(['autoGroupEnabled'], (result) => {
  // Default to true if not set
  toggle.checked = result.autoGroupEnabled !== false;
});

// Save state on change
toggle.addEventListener('change', () => {
  chrome.storage.local.set({ autoGroupEnabled: toggle.checked });
});
