//@ts-check

const { MessageReaction, User } = require("discord.js");
const { CarrotboardStorage, CarrotboardEntryType } = require("../lib/carrotboard");

module.exports = {
    name: "messageReactionAdd",
    once: false,
    /**
     * @param {MessageReaction} reaction
     * @param {User} user
     */
    async execute(reaction, user) {
        // check if partial
        if (reaction.partial) {
            reaction = await reaction.fetch();
        }
        
        /** @type {CarrotboardStorage} */
        const cbStorage = global.cbStorage;
        const message = reaction.message;
        
        // make sure not a bot and not this client
        if (!message.author.bot && !reaction.me) {
            const emoji = reaction.emoji.toString();
            const messageID = message.id;
            const channelID = message.channelId;
            const authorID = message.author.id;
            const messageContent = message.cleanContent.slice(0, cbStorage.maxMsgLen);

            // add to storage
            await cbStorage.db.add_value(emoji, messageID, authorID, channelID, messageContent);

            // get it from storage
            const entry = await cbStorage.db.get_by_msg_emoji(messageID, emoji);
            if (entry == null) {
                return;
            }

            // check whether its a pin
            if (emoji == cbStorage.pin) {
                if (Number(entry["count"]) == Number(cbStorage.config.pinMinimum)) {
                    await message.pin();
                    // send pin alert
                    await cbStorage.sendCBAlert(reaction, entry["carrot_id"], emoji);
                }
            } else if (Number(entry["count"]) == Number(cbStorage.config.minimum))  {
                // send normal alert
                await cbStorage.sendCBAlert(reaction, entry["carrot_id"], emoji);
            }

            await cbStorage.updateLeaderboard();
        }
    },
};