import { DBlog } from "../lib/database/dblog";

module.exports = {
    name: "ready",
    once: true,
    execute(client: any) {
        const guilds = client.guilds.cache.map((guild: any) => guild.id);
        const logDB = new DBlog();
        global.logDB = logDB;

        (async () => {
            await logDB.create_tables();
            for (let i = 0; i < guilds.length; i++) {
                const g = client.guilds.cache.get(guilds[i]);
                const channels = g.channels.cache;

                const channels_arr = [...channels.values()];
                const channels_filtered = channels_arr.filter((c) => c.type === "GUILD_TEXT");

                for (const channel of channels_filtered) {
                    // console.log(channel.id, channel.name);
                    logDB.channel_add(channel.id, channel.name, g.id);
                }
            }
        })();
    },
};
