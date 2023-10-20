import { Message } from "discord.js";
import { CarrotboardStorage } from "../lib/carrotboard";

/**
 * @param {Message} message
 */
export default {
    name: "messageDelete",
    once: false,
    async execute(message: Message) {
        // check if partial
        if (message.partial) {
            message = await message.fetch();
        }

        const cbStorage: CarrotboardStorage = (global as any).cbStorage;


        // remove it from storage, and update leaderboard
        await cbStorage.db.del_entry(message.id, message.channelId);
        await cbStorage.updateLeaderboard();
    },
};
