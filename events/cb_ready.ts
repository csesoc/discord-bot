import { Client } from "discord.js";
import { CarrotboardStorage } from "../lib/carrotboard";

export default {
	name: "ready",
	once: true,
  	execute(client: Client) {
    	const cbStorage = new CarrotboardStorage(client);
    	(global as any).cbStorage = cbStorage;
  	},
};
