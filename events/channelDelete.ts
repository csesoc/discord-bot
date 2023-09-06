import { Channel } from "discord.js";

export default {
    name: "channelDelete",
    once: false,
    async execute(channel: Channel) {
        const logDB = (global as any).logDB;
        logDB.channel_delete(channel.id);
        console.log("deleted channel" + channel.id);
    },
};
