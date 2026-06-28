const TOKEN = "chatgpt-zed-bridge-local-v1";
const ENDPOINT = "http://127.0.0.1:8765/open";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "open-in-zed") return false;

  fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-chatgpt-zed-token": TOKEN
    },
    body: JSON.stringify({
      text: message.text,
      lang: message.lang,
      url: sender.tab?.url || ""
    })
  })
    .then(async (response) => {
      const body = await response.json().catch(() => ({}));
      sendResponse(response.ok ? body : { ok: false, error: body.error || response.statusText });
    })
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});
