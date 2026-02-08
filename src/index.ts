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
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content) return;

  const reversed = message.content.split("").reverse().join("");
  await message.reply(reversed);
});
client.login(Deno.env.get("DISCORD_TOKEN"));
