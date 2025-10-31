chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === "applyCSS") {
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: injectCSS,
          args: [msg.css]
        });
      } catch (e) {
        console.warn("Injection failed:", e);
      }
    }
    sendResponse({ ok: true });
  }

  if (msg.action === "resetCSS") {
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const g = document.getElementById("morpheon-global-style");
            if (g) g.remove();
          }
        });
      } catch (e) {
        console.warn("Reset failed:", e);
      }
    }
    sendResponse({ ok: true });
  }
});

function injectCSS(css) {
  const old = document.getElementById("morpheon-global-style");
  if (old) old.remove();
  const s = document.createElement("style");
  s.id = "morpheon-global-style";
  s.textContent = css;
  document.documentElement.appendChild(s);
}
