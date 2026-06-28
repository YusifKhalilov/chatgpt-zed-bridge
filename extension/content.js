const blocks = new WeakMap();
const defaultFoldLineLimit = 30;
const settledMs = 1500;
let foldLineLimit = defaultFoldLineLimit;

const languageOf = (pre) => {
  const code = pre.querySelector("code");
  const match = [...(code?.classList || [])].find((name) => name.startsWith("language-"));
  return (match?.replace("language-", "") || pre.dataset.language || "txt").toLowerCase();
};

const codeText = (pre) => pre.textContent || "";

const lineCount = (pre) => {
  const text = codeText(pre).trimEnd();
  return text ? text.split(/\r\n|\r|\n/).length : 0;
};

const updatePanel = (state) => {
  const chars = state.text.length;
  state.meta.textContent = chars
    ? `${state.lang || "code"} block hidden (${chars.toLocaleString()} chars)`
    : `${state.lang || "code"} block hidden (streaming)`;
};

const openInZed = (state) => {
  if (!state.text) {
    state.text = codeText(state.pre).trim();
    state.lang = languageOf(state.pre);
    updatePanel(state);
  }
  if (!state.text) {
    state.button.textContent = "No code yet";
    return;
  }
  state.button.disabled = true;
  state.button.textContent = "Opening...";
  chrome.runtime.sendMessage({ type: "open-in-zed", text: state.text, lang: state.lang }, (reply) => {
    const error = chrome.runtime.lastError?.message || reply?.error;
    state.button.disabled = false;
    state.button.textContent = error ? "Helper offline" : "Open in Zed";
    state.panel.classList.toggle("cgzb-error", Boolean(error));
  });
};

const pruneWhenSettled = (state) => {
  clearTimeout(state.timer);
  state.timer = setTimeout(() => {
    const latest = codeText(state.pre).trim();
    if (latest) state.text = latest;
    state.lang = languageOf(state.pre);
    if (state.pre.textContent) state.pre.textContent = "";
    updatePanel(state);
  }, settledMs);
};

const attach = (pre) => {
  if (blocks.has(pre) || pre.closest(".cgzb-panel")) return;
  if (lineCount(pre) <= foldLineLimit) return;
  const panel = document.createElement("div");
  const meta = document.createElement("span");
  const button = document.createElement("button");
  panel.className = "cgzb-panel";
  meta.className = "cgzb-meta";
  button.className = "cgzb-button";
  button.type = "button";
  button.textContent = "Open in Zed";
  panel.append(meta, button);
  pre.before(panel);
  pre.classList.add("cgzb-source");
  const state = { pre, panel, meta, button, text: "", lang: languageOf(pre), timer: 0 };
  blocks.set(pre, state);
  button.addEventListener("click", () => openInZed(state));
  new MutationObserver(() => pruneWhenSettled(state)).observe(pre, {
    childList: true,
    subtree: true,
    characterData: true
  });
  updatePanel(state);
  pruneWhenSettled(state);
};

const scan = (root = document) => {
  const target = root.nodeType === Node.TEXT_NODE ? root.parentElement : root;
  const pre = target?.closest?.("pre");
  if (pre) {
    attach(pre);
    return;
  }
  if (target?.matches?.("pre")) attach(target);
  target?.querySelectorAll?.("pre").forEach(attach);
};

const setFoldLineLimit = (value) => {
  foldLineLimit = Math.max(1, Number(value) || defaultFoldLineLimit);
  scan();
};

const observeBlocks = () => {
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => scan(node));
      scan(mutation.target);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
};

chrome.storage.sync.get({ foldLineLimit: defaultFoldLineLimit }, ({ foldLineLimit }) => {
  setFoldLineLimit(foldLineLimit);
  observeBlocks();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.foldLineLimit) {
    setFoldLineLimit(changes.foldLineLimit.newValue);
  }
});
