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

  chrome.storage.session.get(["activeGroupId", "activeWindowId"], (data) => {
    let groupId = data.activeGroupId;
    let activeWindowId = data.activeWindowId;

    if (groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      setTimeout(() => {
        // Pull the tab into the group (this automatically moves it across windows if needed)
        chrome.tabs.group({ tabIds: tab.id, groupId: groupId }, () => {
          
          // Detect if it was a popup/new window by checking if the origin window IDs match
          if (activeWindowId && tab.windowId !== activeWindowId) {
            // Force focus onto the newly moved tab
            chrome.tabs.update(tab.id, { active: true });
            
            // Bring your main window to the front just in case the popup stole system focus
            chrome.windows.update(activeWindowId, { focused: true });
          }
        });
      }, 50);
    }
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
