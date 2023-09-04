import { Channel } from "discord.js";

export const channelUpdate = {
    name: "channelUpdate",
    once: false,
    async execute(channel: Channel) {
        const logDB = global.logDB;
        const old_name = await logDB.channelname_get(channel.id);

        if (old_name != channel.toString()) {
            await logDB.channelname_update(channel.toString(), channel.id);
        }
    },
};
