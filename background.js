// Track tabs that were just created to avoid race conditions with onActivated
const recentlyCreatedTabs = new Set();

// 1. Remember the active group per window
chrome.tabs.onActivated.addListener((info) => {
  chrome.tabs.get(info.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;

    chrome.storage.session.get(["activeGroups", "groupTabs"], (data) => {
      let activeGroups = data.activeGroups || {};
      let groupTabs = data.groupTabs || {};
      
      if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        // We switched to a grouped tab: make this the active group for the window
        activeGroups[tab.windowId] = tab.groupId;
        groupTabs[tab.groupId] = tab.id;
      } else if (!recentlyCreatedTabs.has(tab.id)) {
        // We switched to an existing ungrouped tab: clear the active group for this window
        // But we DON'T clear it if the tab was JUST created (to avoid the race condition)
        delete activeGroups[tab.windowId];
      }
      
      chrome.storage.session.set({ 
        activeGroups: activeGroups,
        groupTabs: groupTabs 
      });
    });
  });
});

// 2. Snap new tabs into the window's active group
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) return;

  // Mark this tab as "just created" so onActivated doesn't clear the group immediately
  recentlyCreatedTabs.add(tab.id);
  setTimeout(() => recentlyCreatedTabs.delete(tab.id), 1000);

  chrome.storage.local.get(["autoGroupEnabled"], (settings) => {
    if (settings.autoGroupEnabled === false) return;

    chrome.storage.session.get(["activeGroups"], (data) => {
      let activeGroups = data.activeGroups || {};
      let groupId = activeGroups[tab.windowId];

      if (groupId) {
        // Verify the group still exists before trying to join it
        chrome.tabGroups.get(groupId, (group) => {
          if (chrome.runtime.lastError) return;
          
          setTimeout(() => {
            chrome.tabs.group({ tabIds: tab.id, groupId: groupId });
          }, 50);
        });
      }
    });
  });
});

// 3. Clear active group memory when a group is closed
chrome.tabGroups.onRemoved.addListener((group) => {
  chrome.storage.session.get(["activeGroups"], (data) => {
    let activeGroups = data.activeGroups || {};
    let changed = false;
    for (let windowId in activeGroups) {
      if (activeGroups[windowId] === group.id) {
        delete activeGroups[windowId];
        changed = true;
      }
    }
    if (changed) chrome.storage.session.set({ activeGroups });
  });
});

// 4. The Toggle Shortcut (Collapse OR Expand)
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

// 5. Update icon when enabled/disabled
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.autoGroupEnabled) {
    const enabled = changes.autoGroupEnabled.newValue;
    if (enabled) {
      chrome.action.setIcon({ path: "icon.png" });
    } else {
      chrome.storage.local.get(['grayIconData'], (result) => {
        if (result.grayIconData) {
          chrome.action.setIcon({ path: result.grayIconData });
        }
      });
    }
  }
});

// Initialize icon on startup
chrome.storage.local.get(["autoGroupEnabled", "grayIconData"], (result) => {
  if (result.autoGroupEnabled === false && result.grayIconData) {
    chrome.action.setIcon({ path: result.grayIconData });
  }
});
