//@ts-check

const { MessageReaction, User } = require("discord.js");
const { CarrotboardStorage } = require("../lib/carrotboard");

module.exports = {
    name: "messageReactionRemove",
    once: false,
    /**
     * @param {MessageReaction} reaction
     * @param {User} user
     */
    async execute(reaction, user) {
        /** @type {CarrotboardStorage} */
        const cbStorage = global.cbStorage;
        const message = reaction.message;
        
        if (!message.author.bot && !reaction.me) {
            // get the details
            const emoji = reaction.emoji.name;
            const messageID = message.id;
            const channelID = message.channelId;
            const authorID = message.author.id;

            // subtract from storage
            await cbStorage.db.sub_value(emoji, messageID, authorID, channelID);

            await cbStorage.updateLeaderboard();
        }
    },
};