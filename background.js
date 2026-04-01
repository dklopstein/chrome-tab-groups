// 1. Remember your current group in Chrome's session storage (survives sleep mode)
chrome.tabs.onActivated.addListener((info) => {
  chrome.tabs.get(info.tabId, (tab) => {
    chrome.storage.session.set({ activeGroupId: tab.groupId });
  });
});

// 2. Snap new tabs into your remembered group
chrome.tabs.onCreated.addListener((tab) => {
  // Ignore if Chrome already grouped it
  if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) return;

  chrome.storage.session.get("activeGroupId", (data) => {
    let groupId = data.activeGroupId;
    
    // If your last active tab was in a group, pull this new one in
    if (groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      setTimeout(() => chrome.tabs.group({ tabIds: tab.id, groupId: groupId }), 50);
    }
  });
});

// 3. The Collapse Shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "close-tab-group") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let groupId = tabs[0]?.groupId;
      
      if (groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        // Collapse it
        chrome.tabGroups.update(groupId, { collapsed: true });
        
        // Jump out of the group
        chrome.tabs.query({ currentWindow: true }, (allTabs) => {
          let nextTab = allTabs.find(t => t.groupId !== groupId);
          if (nextTab) chrome.tabs.update(nextTab.id, { active: true });
        });
      }
    });
  }
});
