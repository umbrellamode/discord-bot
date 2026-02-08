import type { Message } from "discord.js";

export type Command = {
  name: string;
  matches: (message: Message) => boolean;
  execute: (message: Message) => Promise<void>;
};
