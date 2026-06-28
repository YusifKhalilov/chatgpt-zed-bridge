# ChatGPT Zed Bridge

Collapses `chatgpt.com` code blocks and opens them in Zed.

## Run helper

```sh
cd /Users/joekoe/Documents/chatgpt-zed-bridge/helper
npm start
```

The helper is also installed as a macOS LaunchAgent:

```sh
launchctl print gui/501/com.joekoe.chatgpt-zed-bridge
```

Logs:

```sh
tail -f ~/Library/Logs/chatgpt-zed-bridge.err.log
tail -f ~/Library/Logs/chatgpt-zed-bridge.out.log
```

## Install extension

1. Open `chrome://extensions` in the ChatGPT-only Chrome profile.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select `/Users/joekoe/Documents/chatgpt-zed-bridge/extension`.

## Use

Open `https://chatgpt.com/` and ask for code. Code blocks are hidden, pruned after they stop changing, and can be opened with `Open in Zed`.
