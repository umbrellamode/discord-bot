// Load .env locally, Railway provides env vars directly
try {
  await import("@std/dotenv/load");
} catch {
  // Running in production without .env file
}
import { Client, GatewayIntentBits, Events } from "discord.js";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Minimal HTTP server so platforms with health checks stay green.
const portEnv = Deno.env.get("PORT");
const port = portEnv ? Number(portEnv) : undefined;
Deno.serve(port ? { port } : {}, () => new Response("OK"));

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content) return;

  const reversed = message.content.split("").reverse().join("");
  await message.reply(reversed);
});
const token = Deno.env.get("DISCORD_TOKEN");
if (!token) {
  console.error("DISCORD_TOKEN is not set.");
} else {
  client.login(token);
}
