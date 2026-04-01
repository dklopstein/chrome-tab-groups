# Tab Group Toggle Shortcut

A lightweight, sleep-proof Chrome extension that allows you to instantly collapse and expand your current tab group using a keyboard shortcut, while also smartly managing new tabs.

## 🚀 Features

* **Instant Toggle:** Press `Ctrl + Shift + Space` (`Cmd + Shift + Space` on Mac) to collapse the tab group you are currently browsing. Press it again to expand the group and jump right back to your last active tab.
* **Smart Tab Grouping:** Fixes Chrome's default behavior by automatically snapping newly opened tabs (`Ctrl + T`) into your currently active tab group.
* **Sleep-Proof Memory:** Uses Chrome's Session Storage API to remember your active groups, ensuring the extension still works perfectly even if Chrome puts background scripts to sleep to save RAM.

## 🛠️ Installation (Local/Developer Mode)

Since this extension is designed for local use, you can install it directly into Chrome in just a few seconds:

1. Download or clone this repository to a folder on your computer (e.g., `TabGroupToggle`).
2. Open Google Chrome and type `chrome://extensions/` into the address bar.
3. In the top right corner, toggle the **Developer mode** switch to **ON**.
4. Click the **Load unpacked** button in the top left corner.
5. Select the folder containing your extension files (`manifest.json`, `background.js`, etc.).
6. The extension is now active! 

## ⌨️ Usage & Customization

**Default Shortcut:** `Ctrl + Shift + Space` (Windows/Linux) or `Command + Shift + Space` (Mac).

**How to change the shortcut:**
1. Go to `chrome://extensions/shortcuts` in your browser.
2. Scroll down to find this extension.
3. Click the pencil icon next to the command and press your preferred key combination.

## 🔒 Permissions Justification

This extension operates entirely locally on your machine and collects zero user data. It requests the following permissions in the `manifest.json` file strictly for core functionality:

* `"tabs"`: Required to identify your currently active tab, find the first available tab when jumping out of a group, and move newly created tabs.
* `"tabGroups"`: Required to read the ID of the group you are in and execute the collapse/expand commands.
* `"storage"`: Required to securely store your active group ID in Chrome's temporary session memory, preventing the extension from "forgetting" your group when the browser puts background service workers to sleep.

## 📁 File Structure
```text
/
├── background.js   # The main service worker handling logic and memory
├── icon.png        # The 128x128 extension icon
├── manifest.json   # Extension metadata, permissions, and shortcut definitions
└── README.md       # This documentation file