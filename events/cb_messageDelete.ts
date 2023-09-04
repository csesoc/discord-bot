// @ts-check
import { Message } from "discord.js";
import { CarrotboardStorage } from "../lib/carrotboard";

export const messageDelete = {
    name: "messageDelete",
    once: false,
    async execute(message: Message) {
        // check if partial
        if (message.partial) {
            message = await message.fetch();
        }

        const cbStorage: CarrotboardStorage = global.cbStorage;

        // remove it from storage, and update leaderboard
        await cbStorage.db.del_entry(Number(message.id), Number(message.channelId));
        await cbStorage.updateLeaderboard();
    },
};
