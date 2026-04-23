const toggle = document.getElementById('group-toggle');

// Load current state
chrome.storage.local.get(['autoGroupEnabled'], (result) => {
  toggle.checked = result.autoGroupEnabled !== false;
  updateIcon(toggle.checked);
});

// Save state on change
toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ autoGroupEnabled: enabled });
  updateIcon(enabled);
});

function updateIcon(enabled) {
  if (enabled) {
    chrome.action.setIcon({ path: "icon.png" });
  } else {
    generateGrayIcon((dataUrl) => {
      chrome.action.setIcon({ path: dataUrl });
    });
  }
}

function generateGrayIcon(callback) {
  // Check if we already have it in storage to avoid re-generating
  chrome.storage.local.get(['grayIconData'], (result) => {
    if (result.grayIconData) {
      callback(result.grayIconData);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // Draw grayscale
      ctx.filter = 'grayscale(100%)';
      ctx.drawImage(img, 0, 0);
      
      const dataUrl = canvas.toDataURL();
      chrome.storage.local.set({ grayIconData: dataUrl });
      callback(dataUrl);
    };
    img.src = "icon.png";
  });
}
