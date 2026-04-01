chrome.commands.onCommand.addListener((command) => {
  if (command === "close-tab-group") { 
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;

      const currentTab = tabs[0];
      const groupId = currentTab.groupId;

      // Check if the tab is actually inside a group
      if (groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        
        // 1. Collapse the group
        chrome.tabGroups.update(groupId, { collapsed: true }, () => {
          
          // 2. Look at all tabs in the current window
          chrome.tabs.query({ currentWindow: true }, (allTabs) => {
            
            // Find the very first tab (reading left to right) that is NOT in the group we just collapsed
            const firstAvailableTab = allTabs.find(tab => tab.groupId !== groupId);
            
            // If we found one, switch focus to it
            if (firstAvailableTab) {
              chrome.tabs.update(firstAvailableTab.id, { active: true });
            }
          });
        });
      }
    });
  }
});
