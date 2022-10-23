// @ts-check

module.exports = {
    name: "messageReactionRemoveAll",
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
