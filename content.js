(async()=>{
  const url = location.hostname;
  const data = await chrome.storage.local.get(["global", url]);
  const g = data.global || {};
  const site = data[url] || {};

  if (!g.enabled) return;

  const css = `
  html, body {
    background-color: ${g.bg || "#202124"} !important;
    background-image: ${g.bgimg ? `url(${g.bgimg})` : "none"};
    background-size: cover;
    background-repeat: no-repeat;
    color: ${g.text || "#e0e0e0"} !important;
  }
  header, nav, footer, section, article, div:not(:has(*)) {
    background-color: ${g.surface || "#1e1e1e"} !important;
    border-color: ${g.border || "#333"} !important;
  }
  a, button {
    color: ${g.accent || "#4285f4"} !important;
  }
  img, video, svg, canvas {
    filter: none !important;
  }
  ${site.css || ""}
  `;

  const style = document.createElement("style");
  style.id = "morpheon-global-style";
  style.textContent = css;
  document.documentElement.appendChild(style);
})();
