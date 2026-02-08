// Load .env locally, Railway provides env vars directly
try {
  await import("@std/dotenv/load");
} catch {
  // Running in production without .env file
}
import {
  Client,
  GatewayIntentBits,
  Events,
  Partials,
  type TextBasedChannel,
} from "discord.js";
import { commands } from "./commands/mod.ts";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

async function sendToChannel(content: string, channelId: string): Promise<void> {
  if (!client.isReady()) return;
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  await (channel as TextBasedChannel).send(content);
}

async function broadcastToGuildChannels(content: string): Promise<void> {
  if (!client.isReady()) return;
  for (const guild of client.guilds.cache.values()) {
    const channels = await guild.channels.fetch();
    for (const channel of channels.values()) {
      if (!channel || !channel.isTextBased()) continue;
      await (channel as TextBasedChannel).send(content);
    }
  }
}

async function parseWebSocketMessage(
  data: unknown,
): Promise<{ content: string; channelId?: string }> {
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed) as { content?: string; channelId?: string };
        if (typeof parsed.content === "string") {
          return { content: parsed.content, channelId: parsed.channelId };
        }
      } catch {
        // Fall back to treating the data as plain text.
      }
    }
    return { content: data };
  }

  if (data instanceof ArrayBuffer) {
    const text = new TextDecoder().decode(data);
    return { content: text };
  }

  if (data instanceof Blob) {
    const text = await data.text();
    return { content: text };
  }

  return { content: String(data) };
}

// Minimal HTTP server so platforms with health checks stay green.
const portEnv = Deno.env.get("PORT");
const port = portEnv ? Number(portEnv) : undefined;
Deno.serve(port ? { port } : {}, (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/ws") {
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response("Expected websocket", { status: 426 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.addEventListener("open", () => {
      console.log("[ws] client connected");
    });
    socket.addEventListener("message", async (event) => {
      const payload = await parseWebSocketMessage(event.data);
      console.log("[ws] message", payload);

      if (payload.content.trim().length === 0) return;

      if (payload.channelId) {
        void sendToChannel(payload.content, payload.channelId);
        return;
      }

      void broadcastToGuildChannels(payload.content);
    });
    socket.addEventListener("close", () => {
      console.log("[ws] client disconnected");
    });
    socket.addEventListener("error", (event) => {
      console.error("[ws] error", event);
    });

    return response;
  }

  return new Response("OK");
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content) return;

  console.log(
    `[message] ${message.author.tag} in #${message.channel?.id ?? "unknown"}: ${message.content}`,
  );

  for (const command of commands) {
    if (command.matches(message)) {
      await command.execute(message);
      return;
    }
  }

  const reversed = message.content.split("").reverse().join("");
  await message.reply(reversed);
});
const token = Deno.env.get("DISCORD_TOKEN");
if (!token) {
  console.error("DISCORD_TOKEN is not set.");
} else {
  client.login(token);
}
