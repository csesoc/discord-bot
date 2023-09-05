module.exports = {
    name: "messageReactionRemove",
    once: false,
    /**
     * @param {import("discord.js").MessageReaction} reaction
     * @param {import("discord.js").User} user
     */
    async execute(reaction:any) {
        // check if partial
        if (reaction.partial) {
            reaction = await reaction.fetch();
        }
  
        /** @type {CarrotboardStorage} */
        const cbStorage = (global as any).cbStorage;
        const message = reaction.message;
  
        // make sure not bot and not the current client
        if (!message.author.bot && !reaction.me) {
            // get the details
            const emoji = reaction.emoji.toString();
            const messageID = message.id;
            const channelID = message.channelId;
            const authorID = message.author.id;
    
            // subtract from storage
            await cbStorage.db.sub_value(emoji, messageID, authorID, channelID);
  
            await cbStorage.updateLeaderboard();
        }
    },
};
  