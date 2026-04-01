// 1. Remember your active group AND the last specific tab you looked at in that group
chrome.tabs.onActivated.addListener((info) => {
  chrome.tabs.get(info.tabId, (tab) => {
    chrome.storage.session.get(["groupTabs"], (data) => {
      let groupTabs = data.groupTabs || {};
      
      // If you are inside a group, save this specific tab as the most recent one for this group
      if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        groupTabs[tab.groupId] = tab.id;
      }
      
      chrome.storage.session.set({ 
        activeGroupId: tab.groupId,
        groupTabs: groupTabs 
      });
    });
  });
});

// 2. Snap new tabs into your remembered group (unchanged)
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) return;

  chrome.storage.session.get("activeGroupId", (data) => {
    let groupId = data.activeGroupId;
    if (groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      setTimeout(() => chrome.tabs.group({ tabIds: tab.id, groupId: groupId }), 50);
    }
  });
});

// 3. The Toggle Shortcut (Collapse OR Expand)
chrome.commands.onCommand.addListener((command) => {
  if (command === "close-tab-group") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let currentTab = tabs[0];
      let groupId = currentTab?.groupId;
      
      // SCENARIO A: You are currently IN a group -> COLLAPSE IT
      if (groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        chrome.tabGroups.update(groupId, { collapsed: true });
        
        // Remember that this was the last group we collapsed
        chrome.storage.session.set({ lastCollapsedGroupId: groupId });
        
        // Jump out of the group
        chrome.tabs.query({ currentWindow: true }, (allTabs) => {
          let nextTab = allTabs.find(t => t.groupId !== groupId);
          if (nextTab) chrome.tabs.update(nextTab.id, { active: true });
        });
      } 
      // SCENARIO B: You are OUTSIDE a group -> EXPAND THE LAST COLLAPSED ONE
      else {
        chrome.storage.session.get(["lastCollapsedGroupId", "groupTabs"], (data) => {
          let targetGroup = data.lastCollapsedGroupId;
          let groupTabs = data.groupTabs || {};
          
          if (targetGroup) {
            // Expand the group (fails gracefully if you manually deleted the group)
            chrome.tabGroups.update(targetGroup, { collapsed: false }, () => {
              if (chrome.runtime.lastError) return; 

              // Find the exact tab you were last looking at in that group and jump to it
              let targetTabId = groupTabs[targetGroup];
              if (targetTabId) {
                chrome.tabs.update(targetTabId, { active: true }, () => {
                  if (chrome.runtime.lastError) {} // Fails gracefully if you manually closed that specific tab
                });
              }
            });
          }
        });
      }
    });
  }
});
