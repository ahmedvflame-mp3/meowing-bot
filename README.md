# meowing-bot
A bot that loves to meow lmao.

A simple open-source Discord bot using slash commands and a lightweight keep-alive web server. Licensed under the GNU GPL v3.

## 🧩 Features

- `/ping` – Responds with latency
- `/meow` – Sends `meow.mp3` (must exist in the root)
- `/reset` – Resets all cooldowns (owner-only)
- Per-user cooldowns
- Keep-alive server using Express (port 3000)

## 📦 Requirements

- Node.js (v18+ recommended)
- `discord.js`
- `express`
- `dotenv`
Install dependencies:

```bash
npm install
