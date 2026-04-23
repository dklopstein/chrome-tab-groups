// 1. Remember your active group, window, AND the last specific tab
chrome.tabs.onActivated.addListener((info) => {
  chrome.tabs.get(info.tabId, (tab) => {
    chrome.storage.session.get(["groupTabs"], (data) => {
      let groupTabs = data.groupTabs || {};
      
      if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        groupTabs[tab.groupId] = tab.id;
      }
      
      chrome.storage.session.set({ 
        activeGroupId: tab.groupId,
        activeWindowId: tab.windowId, // <-- We are now tracking your active window
        groupTabs: groupTabs 
      });
    });
  });
});

// 2. Snap new tabs into your remembered group
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) return;

  chrome.storage.local.get(["autoGroupEnabled"], (settings) => {
    if (settings.autoGroupEnabled === false) return;

    chrome.storage.session.get(["activeGroupId", "activeWindowId"], (data) => {
      let groupId = data.activeGroupId;
      let activeWindowId = data.activeWindowId;

      // Only group if the tab is created in the same window as the active group
      if (groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && tab.windowId === activeWindowId) {
        setTimeout(() => {
          chrome.tabs.group({ tabIds: tab.id, groupId: groupId });
        }, 50);
      }
    });
  });
});

// 3. The Toggle Shortcut (Collapse OR Expand)
chrome.commands.onCommand.addListener((command) => {
  if (command === "close-tab-group") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let currentTab = tabs[0];
      let groupId = currentTab?.groupId;
      
      if (groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        chrome.tabGroups.update(groupId, { collapsed: true });
        chrome.storage.session.set({ lastCollapsedGroupId: groupId });
        
        chrome.tabs.query({ currentWindow: true }, (allTabs) => {
          let nextTab = allTabs.find(t => t.groupId !== groupId);
          if (nextTab) chrome.tabs.update(nextTab.id, { active: true });
        });
      } 
      else {
        chrome.storage.session.get(["lastCollapsedGroupId", "groupTabs"], (data) => {
          let targetGroup = data.lastCollapsedGroupId;
          let groupTabs = data.groupTabs || {};
          
          if (targetGroup) {
            chrome.tabGroups.update(targetGroup, { collapsed: false }, () => {
              if (chrome.runtime.lastError) return; 
              let targetTabId = groupTabs[targetGroup];
              if (targetTabId) {
                chrome.tabs.update(targetTabId, { active: true }, () => {
                  if (chrome.runtime.lastError) {} 
                });
              }
            });
          }
        });
      }
    });
  }
});
