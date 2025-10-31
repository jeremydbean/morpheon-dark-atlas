(async()=>{
  const url = location.hostname;
  const data = await chrome.storage.local.get(["global", url]);
  const g = data.global || {};
  const site = data[url] || {};

  if (!g.enabled) return;

  const brightness = toNumber(g.brightness, 1);
  const contrast = toNumber(g.contrast, 1);
  const sepia = toNumber(g.sepia, 0);

  const adjusted = adjustThemeColors(g, brightness, contrast, sepia);

  const css = `
  html, body {
    background-color: ${adjusted.bg || "#202124"} !important;
    background-image: ${g.bgimg ? `url(${g.bgimg})` : "none"};
    background-size: cover;
    background-repeat: no-repeat;
    color: ${adjusted.text || "#e0e0e0"} !important;
  }
  header, nav, footer, section, article, div:not(:has(*)) {
    background-color: ${adjusted.surface || "#1e1e1e"} !important;
    border-color: ${adjusted.border || "#333"} !important;
  }
  a, button {
    color: ${adjusted.accent || "#4285f4"} !important;
  }
  img, video, svg, canvas {
    filter: none !important;
  }
  ${site.css || ""}
  `;

  const existing = document.getElementById("morpheon-global-style");
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = "morpheon-global-style";
  style.textContent = css;
  document.documentElement.appendChild(style);
})();

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
