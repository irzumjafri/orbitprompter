# OrbitPrompter 🚀

**Control your AI coding assistant from anywhere — right from Telegram.**

---

OrbitPrompter is a powerful, local Telegram bot that lets you remotely operate your **Antigravity IDE** on your computer from your smartphone, tablet, or any Telegram-capable device. 

This is a custom, v2-compatible fork of [Remoat](https://github.com/optimistengineer/Remoat), featuring full support for the latest Antigravity updates and streamlined CDP (Chrome DevTools Protocol) integrations.

---

## 📖 Table of Contents

- [Quick Start](#-quick-start)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [Commands](#-commands)
- [Acknowledgements & Credits](#-acknowledgements--credits)
- [License](#-license)

---

## ⚡ Quick Start

### 1. Install OrbitPrompter Globally
To run OrbitPrompter on your system, install it globally using `npm`:
```bash
npm install -g orbitprompter
```

### 2. Configure Your Environment
Run the interactive setup wizard to link your Telegram bot:
```bash
orbitprompter setup
```

The wizard will guide you through:
- **Telegram Bot Token** — Get this from [@BotFather](https://t.me/BotFather) on Telegram.
- **Allowed User IDs** — Whitelist your account. Message [@userinfobot](https://t.me/userinfobot) to get your ID.
- **Workspace Directory** — The parent directory of your coding projects.

### 3. Launch Antigravity with CDP Enablement
```bash
orbitprompter open
```

### 4. Start the Bot Service
```bash
orbitprompter start
```

Now open Telegram, locate your bot, and start sending instructions!

---

## 🎨 Key Features

- **v2 Antigravity Compatibility:** Fully optimized with updated DOM selectors to match the newest Antigravity IDE updates.
- **Workspace Isolation via Topics:** Each of your projects maps cleanly to a Telegram Forum Topic.
- **Real-Time Progress Streaming:** Long-running tasks report live progress, timers, and logs.
- **Security by Design:** Whitelist-based access control, credentials stored locally, and no external port exposures.

---

## 🛠️ Commands

### CLI Commands

```bash
orbitprompter         # Auto-detect: runs setup if needed, otherwise starts the bot
orbitprompter setup   # Interactive setup wizard
orbitprompter open    # Launch Antigravity IDE with CDP port enabled
orbitprompter start   # Start the Telegram bot service
orbitprompter doctor  # Diagnose configuration and connectivity issues
```

### Telegram Commands

| Command | Description |
|---------|-------------|
| `/project` | Browse and select an active project |
| `/new` | Start a new session in the current project |
| `/screenshot` | Capture and send Antigravity IDE's current window |
| `/status` | Show connection status and active configuration |
| `/autoaccept` | Toggle auto-approval of file edit dialogs |
| `/help` | Show available commands |

---

## 🤝 Acknowledgements & Credits

OrbitPrompter is proud to build upon the work of the open-source community:
- **[Remoat](https://github.com/optimistengineer/Remoat)**: The brilliant original Telegram-based remote controller for Antigravity, which serves as the foundation for this repository.
- **[LazyGravity](https://github.com/tokyoweb3/LazyGravity)**: The pioneering Discord bot that proved remote control via CDP was possible.

Our deepest appreciation goes to the creators and contributors of these repositories for making this ecosystem possible!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
