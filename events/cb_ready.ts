import { Client } from "discord.js";
import { CarrotboardStorage } from "../lib/carrotboard";

export const ready = {
	name: "ready",
	once: true,
  	execute(client: Client) {
    	const cbStorage = new CarrotboardStorage(client);
    	global.cbStorage = cbStorage;
  	},
};
