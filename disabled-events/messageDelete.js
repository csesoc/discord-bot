module.exports = {
    name: "messageDelete",
    once: false,
    async execute(message) {
        // ignore messages sent from bot
        if (message.author.bot) {
            return;
        }

        const logDB = global.logDB;
        logDB.message_delete(message.id);
    },
};
