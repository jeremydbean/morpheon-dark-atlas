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
  document.getElementById("brightness").value = g.brightness ?? 1;
  document.getElementById("contrast").value = g.contrast ?? 1;
  document.getElementById("sepia").value = g.sepia ?? 0;
}

document.getElementById("applyTheme").onclick = async () => {
  const preset = document.getElementById("preset").value;
  const brightness = parseFloat(document.getElementById("brightness").value);
  const contrast = parseFloat(document.getElementById("contrast").value);
  const sepia = parseFloat(document.getElementById("sepia").value);
  const g = {
    ...presets[preset],
    enabled: document.getElementById("enableDark").checked,
    preset,
    brightness,
    contrast,
    sepia
  };
  await chrome.storage.local.set({ global: g });
  const css = buildGlobalCSS(g);
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

function buildGlobalCSS(settings){
  const brightness = toNumber(settings.brightness, 1);
  const contrast = toNumber(settings.contrast, 1);
  const sepia = toNumber(settings.sepia, 0);
  const adjusted = adjustThemeColors(settings, brightness, contrast, sepia);

  return (
    "html,body{\n" +
    "  background-color:" + (adjusted.bg || "#202124") + "!important;\n" +
    "  background-image:" + (settings.bgimg ? "url(" + settings.bgimg + ")" : "none") + ";\n" +
    "  background-size:cover;\n" +
    "  background-repeat:no-repeat;\n" +
    "  color:" + (adjusted.text || "#e0e0e0") + "!important;\n" +
    "}\n" +
    "header,nav,footer,section,article,div:not(:has(*)){\n" +
    "  background-color:" + (adjusted.surface || "#1e1e1e") + "!important;\n" +
    "  border-color:" + (adjusted.border || "#333") + "!important;\n" +
    "}\n" +
    "a,button{color:" + (adjusted.accent || "#4285f4") + "!important;}\n" +
    "img,video,svg,canvas{filter:none!important;}\n"
  );
}

function adjustThemeColors(theme, brightness, contrast, sepia){
  const adjust = (color) => color ? applyFiltersToHex(color, brightness, contrast, sepia) : color;
  return {
    bg: adjust(theme.bg),
    surface: adjust(theme.surface),
    text: adjust(theme.text),
    border: adjust(theme.border),
    accent: adjust(theme.accent)
  };
}

function applyFiltersToHex(hex, brightness, contrast, sepia){
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  let [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];

  [r, g, b] = applyBrightness(r, g, b, brightness);
  [r, g, b] = applyContrast(r, g, b, contrast);
  [r, g, b] = applySepia(r, g, b, sepia);

  return rgbToHex(r * 255, g * 255, b * 255);
}

function applyBrightness(r, g, b, amount){
  return [
    clamp01(r * amount),
    clamp01(g * amount),
    clamp01(b * amount)
  ];
}

function applyContrast(r, g, b, amount){
  return [
    clamp01((r - 0.5) * amount + 0.5),
    clamp01((g - 0.5) * amount + 0.5),
    clamp01((b - 0.5) * amount + 0.5)
  ];
}

function applySepia(r, g, b, amount){
  if (!amount) return [r, g, b];
  const a = clamp01(amount);
  const inv = 1 - a;
  const nr = clamp01(r * (0.393 + 0.607 * inv) + g * (0.769 - 0.769 * inv) + b * (0.189 - 0.189 * inv));
  const ng = clamp01(r * (0.349 - 0.349 * inv) + g * (0.686 + 0.314 * inv) + b * (0.168 - 0.168 * inv));
  const nb = clamp01(r * (0.272 - 0.272 * inv) + g * (0.534 - 0.534 * inv) + b * (0.131 + 0.869 * inv));
  return [nr, ng, nb];
}

function hexToRgb(hex){
  if (typeof hex !== "string") return null;
  let value = hex.trim().replace(/^#/, "");
  if (value.length === 3) value = value.split("").map(x => x + x).join("");
  if (value.length !== 6) return null;
  const int = parseInt(value, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}

function rgbToHex(r, g, b){
  const toHex = (v) => {
    const clamped = Math.round(clamp01(v / 255) * 255);
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp01(value){
  return Math.min(1, Math.max(0, value));
}

function toNumber(value, fallback){
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
