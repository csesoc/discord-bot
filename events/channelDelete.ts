import { Channel } from "discord.js";

export const channelDelete = {
    name: "channelDelete",
    once: false,
    async execute(channel: Channel) {
        const logDB = global.logDB;
        logDB.channel_delete(channel.id);
        console.log("deleted channel" + channel.id);
    },
};
