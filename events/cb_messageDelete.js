//@ts-check

const { Message } = require("discord.js");
const { CarrotboardStorage } = require("../lib/carrotboard");

module.exports = {
    name: "messageDelete",
    once: false,
    /**
     * @param {Message} message 
     */
    async execute(message) {
        // check if partial
        if (message.partial) {
            message = await message.fetch();
        }

        /** @type {CarrotboardStorage} */
        const cbStorage = global.cbStorage;
        
        // remove it from storage, and update leaderboard
        await cbStorage.db.del_entry(message.id, message.channelId);
        await cbStorage.updateLeaderboard();
    },
};