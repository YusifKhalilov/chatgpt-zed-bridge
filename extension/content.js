const blocks = new WeakMap();
const settledMs = 1500;

const languageOf = (pre) => {
  const code = pre.querySelector("code");
  const match = [...(code?.classList || [])].find((name) => name.startsWith("language-"));
  return (match?.replace("language-", "") || pre.dataset.language || "txt").toLowerCase();
};

const codeText = (pre) => pre.textContent || "";

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
  if (root.matches?.("pre")) attach(root);
  root.querySelectorAll?.("pre").forEach(attach);
};

new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => scan(node));
  }
}).observe(document.documentElement, { childList: true, subtree: true });

scan();
