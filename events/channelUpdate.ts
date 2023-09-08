import { Channel, GuildChannel } from "discord.js";

export default {
    name: "channelUpdate",
    once: false,
    async execute(_oldChannel: Channel, newChannel: Channel) {
        try {
            // Ensure the channel is an instance of GuildChannel
            if (!(newChannel instanceof GuildChannel)) return;

            const logDB = (global as any).logDB;
            const dbStoredName = await logDB.channelname_get(newChannel.id);

            if (!dbStoredName || !dbStoredName[0] || !dbStoredName[0].channel_name) return;

            const latestChannelName = newChannel.name;

            if (dbStoredName[0].channel_name !== latestChannelName) {
                await logDB.channelname_update(latestChannelName, newChannel.id);
                console.log(`Updated channel name in DB to: ${latestChannelName}`);
            }
        } catch (error) {
            console.error("Error in channelUpdate event:", error);
        }
    },
};