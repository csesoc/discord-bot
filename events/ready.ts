import { Client ,Events  } from "discord.js";

export const ready = {
    name: Events.ClientReady,
    once: true,
    execute(client: Client): void {
        console.log("------------------------------------------------------------");
        console.log(client);
        // console.log(`Logged in as ${client.user.tag} (ID: ${client.user.id}).`);
        // console.log(`Connected to ${client.guilds.cache.size} guilds:`);
        // for (const guild of client.guilds.cache.values()) {
        //     console.log(`- ${guild.name}`);
        // }
        // console.log(`Loaded ${client.commands.size} commands:`);
        // for (const command of client.commands.values()) {
        //     console.log(`- ${command.data.name}`);
        // }
        console.log("------------------------------------------------------------");
    },
};
  