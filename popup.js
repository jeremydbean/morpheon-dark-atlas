const tabs = document.querySelectorAll(".tab");
const sections = document.querySelectorAll(".tab-section");

tabs.forEach(t=>{
  t.onclick = () => {
    tabs.forEach(x => x.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));
    t.classList.add("active");
    document.getElementById(t.dataset.tab).classList.add("active");
  };
});

async function getDomain(){
  return new Promise(res => {
    chrome.tabs.query({active:true, currentWindow:true}, t => {
      res(new URL(t[0].url).hostname);
    });
  });
}

const presets = {
  morpheon: {
    bg: "#202124", surface: "#2d2d2d", text: "#e0e0e0", accent: "#4285f4",
    border: "#333",
    bgimg: "https://lh3.googleusercontent.com/F74qsD8LUEBsHo-8H-2aB_e8Lo3M4Doiulma9fiIzp6Hbi6ZwRC5p9CxqsbXAtoDiPdpTmS_x0RdsCGBjTkbh4RNY5Y=s1280"
  },
  charcoal: {
    bg: "#181a1b", surface: "#222426", text: "#e0e0e0", accent: "#66bb6a", border: "#2f2f2f"
  },
  slate: {
    bg: "#1b1e22", surface: "#262a2f", text: "#d8dee9", accent: "#81a1c1", border: "#3b4252"
  },
  midnight: {
    bg: "#0f1115", surface: "#1a1c20", text: "#d7d7d7", accent: "#8ab4f8", border: "#24272c"
  },
  obsidian: {
    bg: "#111", surface: "#1a1a1a", text: "#e8e8e8", accent: "#ff8c00", border: "#2a2a2a"
  }
};

async function loadSettings(){
  const data = await chrome.storage.local.get("global");
  const g = data.global || {};
  document.getElementById("enableDark").checked = g.enabled || false;
  document.getElementById("preset").value = g.preset || "morpheon";
}

document.getElementById("applyTheme").onclick = async () => {
  const preset = document.getElementById("preset").value;
  const g = { ...presets[preset], enabled: document.getElementById("enableDark").checked, preset };
  await chrome.storage.local.set({ global: g });
  const css =
    "html,body{\n" +
    "  background-color:" + g.bg + "!important;\n" +
    "  background-image:" + (g.bgimg ? "url(" + g.bgimg + ")" : "none") + ";\n" +
    "  color:" + g.text + "!important;\n" +
    "}\n" +
    "header,nav,footer,section,article,div:not(:has(*)){\n" +
    "  background-color:" + g.surface + "!important;\n" +
    "  border-color:" + g.border + "!important;\n" +
    "}\n" +
    "a,button{color:" + g.accent + "!important;}\n" +
    "img,video,svg,canvas{filter:none!important;}\n";
  chrome.runtime.sendMessage({ action: "applyCSS", css });
};

document.getElementById("resetTheme").onclick = () => chrome.runtime.sendMessage({ action: "resetCSS" });

async function loadSite(){
  const domain = await getDomain();
  document.getElementById("domain").textContent = domain;
  const data = await chrome.storage.local.get(domain);
  document.getElementById("siteCSS").value = (data[domain] && data[domain].css) || "";
}

document.getElementById("saveSite").onclick = async () => {
  const domain = await getDomain();
  const css = document.getElementById("siteCSS").value;
  await chrome.storage.local.set({ [domain]: { css } });
};

document.getElementById("clearSite").onclick = async () => {
  const domain = await getDomain();
  await chrome.storage.local.remove(domain);
  document.getElementById("siteCSS").value = "";
};

loadSettings();
loadSite();
