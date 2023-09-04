export const ready = {
    name: "ready",
    once: true,
    execute(client: any): void {
        console.log("------------------------------------------------------------");
        console.log(`Logged in as ${client.user.tag} (ID: ${client.user.id}).`);
        console.log(`Connected to ${client.guilds.cache.size} guilds:`);
        for (const guild of client.guilds.cache.values()) {
            console.log(`- ${guild.name}`);
        }
        console.log(`Loaded ${client.commands.size} commands:`);
        for (const command of client.commands.values()) {
            console.log(`- ${command.data.name}`);
        }
        console.log("------------------------------------------------------------");
    },
};
  