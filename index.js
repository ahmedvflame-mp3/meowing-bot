require("./keep-alive");
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
} = require("discord.js");
;
const fs = require("fs");
const path = require("path");

// === CONFIG ===
const TOKEN = process.env["BOT_TOKEN"];
const CLIENT_ID = process.env["CLIENT_ID"];
const OWNER_ID = process.env["OWNER_ID"];
const COOLDOWN_FILE = "./cooldowns.json";
const COOLDOWN_TIME = 60 * 1000; // 1 minute cooldown

// === Load Cooldowns from File ===
let cooldowns = {};
try {
  if (fs.existsSync(COOLDOWN_FILE)) {
    cooldowns = JSON.parse(fs.readFileSync(COOLDOWN_FILE, "utf-8"));
  }
} catch (err) {
  console.error("⚠️ Error loading cooldown file:", err);
  cooldowns = {};
}

// === Save Cooldowns to File ===
function saveCooldowns() {
  try {
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(cooldowns, null, 2));
  } catch (err) {
    console.error("❌ Failed to save cooldowns:", err);
  }
}

// === Format Time for Cooldown ===
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (minutes) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  if (seconds || parts.length === 0)
    parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
  return parts.join(", ");
}

// === Register Slash Commands ===
const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency."),
  new SlashCommandBuilder()
    .setName("meow")
    .setDescription("Play a cat meow sound."),
  new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Reset all user cooldowns (owner only)."),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Registered global (public) commands.");
  } catch (err) {
    console.error("❌ Failed to register global commands:", err);
  }
})();

// === Bot Setup ===
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// === Command Handling ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;
  const userId = user.id;
  const now = Date.now();

  const isCooldownCommand = ["meow"].includes(commandName);

  if (isCooldownCommand) {
    const lastUsed = cooldowns[userId]?.[commandName] || 0;
    const remaining = COOLDOWN_TIME - (now - lastUsed);

    if (remaining > 0) {
      return interaction.reply({
        content: `⏳ Wait ${formatTime(remaining)} before using /${commandName} again.`,
        ephemeral: true,
      });
    }

    // Save new timestamp
    if (!cooldowns[userId]) cooldowns[userId] = {};
    cooldowns[userId][commandName] = now;
    saveCooldowns();
  }

  // === Handle Commands ===
  try {
    switch (commandName) {
        case "ping": {
          await interaction.deferReply();
          const latency = Date.now() - interaction.createdTimestamp;
          return interaction.editReply(`🏓 Pong! Latency: ${latency}ms`);
        }


      case "meow": {
        const filePath = "./meow.mp3";
        if (!fs.existsSync(filePath)) {
          console.error("❌ meow.mp3 not found!");
          return interaction.reply({
            content: "❌ The file `meow.mp3` is missing.",
            ephemeral: true,
          });
        }

        try {
          await interaction.reply({ files: [filePath] });
          console.log(`[MEOW] ${user.tag} played meow.mp3`);
        } catch (err) {
          console.error("❌ Failed to send meow.mp3:", err);
          return interaction.reply({
            content: "⚠️ Something went wrong when sending the meow sound.",
            ephemeral: true,
          });
        }
        return;
      }

      case "reset": {
        if (userId !== OWNER_ID) {
          return interaction.reply({
            content: "❌ Only the owner can use this command.",
            ephemeral: true,
          });
        }
        cooldowns = {};
        saveCooldowns();
        console.log(`[RESET] Cooldowns cleared by ${user.tag}`);
        return interaction.reply("✅ All cooldowns have been reset.");
      }

      default:
        return interaction.reply({
          content: "❓ Unknown command.",
          ephemeral: true,
        });
    }
  } catch (err) {
    console.error(`❌ Error handling /${commandName}:`, err);
    return interaction.reply({
      content: "⚠️ An error occurred while executing the command.",
      ephemeral: true,
    });
  }
});

client.login(TOKEN);
