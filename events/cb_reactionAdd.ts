// @ts-check
import { MessageReaction, User } from "discord.js";
import { CarrotboardStorage } from "../lib/carrotboard";

module.exports = {
    name: "messageReactionAdd",
    once: false,
    async execute(reaction: MessageReaction, user: User) {
        // check if partial
        if (reaction.partial) {
            reaction = await reaction.fetch();
        }
  
        const cbStorage: CarrotboardStorage = global.cbStorage;
        const message = reaction.message;
  
        // make sure not a bot and not this client
        if (!message.author?.bot && user.id !== cbStorage._client.user?.id) {
            const emoji = reaction.emoji.toString();
            const messageID = Number(message.id);
            const channelID = Number(message.channelId);
            const authorID = Number(message.author?.id);
            const messageContent = message.cleanContent?.slice(0, cbStorage.maxMsgLen);
  
            // add to storage
            await cbStorage.db.add_value(emoji, messageID, authorID, channelID, messageContent!);
    
            // get it from storage
            const entry = await cbStorage.db.get_by_msg_emoji(messageID, emoji);
            if (entry == null) {
                return;
            }
  
            // check whether it's a pin
            if (emoji == cbStorage.pin) {
                if (Number(entry["count"]) == Number(cbStorage.config.pinMinimum)) {
                    await message.pin();
                    // send pin alert
                    await cbStorage.sendCBAlert(reaction, entry["carrot_id"], emoji);
                }
            } else if (Number(entry["count"]) == Number(cbStorage.config.minimum)) {
                // send normal alert
                 await cbStorage.sendCBAlert(reaction, entry["carrot_id"], emoji);
            }
  
            await cbStorage.updateLeaderboard();
        }
    },
};
  