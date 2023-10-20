import { Channel, GuildChannel } from 'discord.js';

export default {
    name: "channelCreate",
    once: false,
    async execute(channel: Channel) {
        const logDB = (global as any).logDB;
        if (!(channel instanceof GuildChannel)) return;
        const guildId = channel.guild.id;

        logDB.channel_add(channel.id, channel.name, guildId);
    },
};