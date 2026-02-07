// Load .env locally, Railway provides env vars directly
try {
  await import("@std/dotenv/load");
} catch {
  // Running in production without .env file
}
import { Client, GatewayIntentBits, Events } from "discord.js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  const channel = message.channel;
  const channelName = "name" in channel ? channel.name : "DM";
  console.log(
    `[MessageCreate] #${channelName} | ${message.author.tag}: "${message.content || "(no content - need MessageContent intent)"}"`,
  );
  if (message.author.bot) {
    console.log("[MessageCreate] Ignoring bot message");
    return;
  }
  if (message.mentions.has(client.user!)) {
    console.log("[MessageCreate] Bot was mentioned, generating joke");

    await message.react("👀");

    const userMessage = message.content
      .replace(/<@!?\d+>/g, "")
      .trim();

    console.log(`[MessageCreate] User message: "${userMessage}"`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a funny comedian bot. Reply with a short, witty joke related to what the user says. Keep it under 2 sentences.",
        },
        {
          role: "user",
          content: userMessage || "tell me a joke",
        },
      ],
    });

    const joke = completion.choices[0].message.content;
    console.log(`[MessageCreate] Generated joke: "${joke}"`);

    await message.reply(`${joke}`);
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  // Check if the bot itself joined a voice channel
  if (newState.member?.id !== client.user?.id) return;

  // Check if it's a join (was not in a channel, now is in one)
  if (!oldState.channel && newState.channel) {
    // Find a text channel in the same guild to send the message
    const textChannel = newState.guild.channels.cache.find(
      (ch) =>
        ch.isTextBased() && ch.permissionsFor(client.user!)?.has("SendMessages")
    );

    if (textChannel?.isTextBased()) {
      await textChannel.send("Hello!");
    }
  }
});

client.login(Deno.env.get("DISCORD_TOKEN"));
