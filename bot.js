const express = require("express");
const mineflayer = require("mineflayer");
const readline = require("readline");
const settings = require("./config/settings");
const { Client, GatewayIntentBits } = require("discord.js");

// ================= EXPRESS KEEPALIVE =================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

// Prevent Render socket timeout issues
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// ================= DISCORD =================
const DISCORD_TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1509812381331619882";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`Discord logged in as ${client.user.tag}`);
});

// ================= GLOBALS =================
let bot = null;
let reconnecting = false;

// ================= READLINE =================
// Optional local terminal chat
if (process.stdin.isTTY) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (input) => {
    if (!bot || !bot.chat) return;

    try {
      if (input.trim()) {
        bot.chat(input);
      }
    } catch (err) {
      console.error("Console chat error:", err.message);
    }
  });
}

// ================= SAFE DISCORD SEND =================
async function sendToDiscord(message) {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel) return;

    await channel.send(message);
  } catch (err) {
    console.error("Discord send error:", err.message);
  }
}

// ================= CREATE BOT =================
function createBot() {
  if (reconnecting) return;

  reconnecting = true;

  const name = process.argv[2] || "ZzZebra";

  console.log(`Creating bot... [${name}]`);

  const serverConfig = settings.server;

  bot = mineflayer.createBot({
    host: serverConfig.serverAddress,
    port: serverConfig.port,
    username: name,
    version: settings.botSettings.version,
  });

  // ================= SPAWN =================
  bot.once("spawn", async () => {
    reconnecting = false;

    console.log("Minecraft bot spawned.");

    try {
      setTimeout(() => {
        if (!bot) return;

        bot.chat("/login prasadpradeep2009");

        setTimeout(() => {
          if (!bot) return;

          bot.chat("/server survival");
        }, 3000);
      }, 5000);
    } catch (err) {
      console.error("Spawn commands error:", err.message);
    }
  });

  // ================= CHAT =================
  bot.on("message", async (jsonMsg) => {
    try {
      const msg = jsonMsg.toString();

      console.log(msg);

      // Send to Discord safely
      await sendToDiscord(`📩 ${msg}`);

      // Auto server join
      if (msg.includes("Right click the")) {
        bot.chat("/server survival");
      }
    } catch (err) {
      console.error("Message handler error:", err.message);
    }
  });

  // ================= ERRORS =================
  bot.on("error", (err) => {
    console.error("Mineflayer error:", err);

    // Ignore common connection reset errors
    if (err.code === "ECONNRESET") {
      console.log("Connection reset detected.");
    }
  });

  // ================= KICK =================
  bot.on("kicked", (reason) => {
    console.log("Bot kicked:", reason);
  });

  // ================= END / RECONNECT =================
  bot.on("end", () => {
    console.log("Bot disconnected. Reconnecting in 10 seconds...");

    reconnecting = false;

    setTimeout(() => {
      try {
        createBot();
      } catch (err) {
        console.error("Reconnect error:", err.message);
      }
    }, 10000);
  });
}

// ================= DISCORD -> MINECRAFT =================
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    if (message.channel.id !== CHANNEL_ID) return;

    if (!bot) return;

    // Send normal messages
    if (!message.content.startsWith("!")) {
      bot.chat(message.content);
      return;
    }

    // Commands
    if (message.content === "!jump") {
      bot.setControlState("jump", true);

      setTimeout(() => {
        if (bot) {
          bot.setControlState("jump", false);
        }
      }, 500);
    }

    if (message.content === "!come") {
      bot.chat("Coming!");
    }
  } catch (err) {
    console.error("Discord command error:", err.message);
  }
});

// ================= PROCESS ERROR SAFETY =================
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// ================= START =================
client.login(DISCORD_TOKEN).catch(console.error);

createBot();
