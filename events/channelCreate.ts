import { Channel } from "discord.js";

export const channelCreate = {
    name: "channelCreate",
    once: false,
    async execute(channel: Channel) {
        const logDB = (global as any).logDB;
        logDB.channel_add(channel.id, channel.toString());
    },
};
