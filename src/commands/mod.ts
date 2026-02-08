import type { Command } from "./types.ts";
import { helloCommand } from "./hello.ts";

export const commands: Command[] = [helloCommand];
export type { Command } from "./types.ts";
