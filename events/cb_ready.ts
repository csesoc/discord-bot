import { CarrotboardStorage } from "../lib/carrotboard";

export const ready = {
	name: "ready",
	once: true,
  	execute(client: any) {
    	const cbStorage = new CarrotboardStorage(client);
    	global.cbStorage = cbStorage;
  	},
};
