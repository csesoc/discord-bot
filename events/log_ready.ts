import { DBlog } from "../lib/database/dblog";
import { Client ,Events, ChannelType } from "discord.js";

export default {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        const guilds = client.guilds.cache.map((guild: any) => guild.id);
        const logDB = new DBlog();
        console.log(guilds);

        (global as any).logDB = logDB;

        (async () => {
            await logDB.create_tables();
            for (let i = 0; i < guilds.length; i++) {
                const g = client.guilds.cache.get(guilds[i])!;
                const channels = g.channels.cache;

                const channels_arr = [...channels.values()];
                const channels_filtered = channels_arr.filter((c) => c.type === ChannelType.GuildText);

                for (const channel of channels_filtered) {
                    // console.log(channel.id, channel.name);
                    logDB.channel_add(channel.id, channel.name, g.id);
                }
            }
        })();
    },
};