import type { Command } from "./types.ts";

export const helloCommand: Command = {
  name: "hello",
  matches: (message) => message.content.trim() === "/hello",
  execute: async (message) => {
    await message.reply("hi");
  },
};
