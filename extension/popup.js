document.getElementById("openEditor").onclick = () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("editor.html")
  });
};
