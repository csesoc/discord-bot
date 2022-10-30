function messagelog(message) {
    // ignore messages sent from bot
    if (message.author.bot) {
        return;
    }

    const logDB = global.logDB;
    logDB.message_create(
        message.id,
        message.author.id,
        message.author.username,
        message.content,
        message.channelId,
    );
}

module.exports = {
    name: "messageCreate",
    async execute(message) {
        const standupDB = global.standupDBGlobal;

        messagelog(message);

        if (message.content.startsWith("$standup")) {
            // Get standup content
            const messages = String(message.content);
            const messageContent = messages.slice(8).trim();
            // console.log(message.channel.parent.name)

            const teamId = message.channel.parentId;

            const standupAuthorId = message.author.id;

            await standupDB.addStandup(teamId, standupAuthorId, message.id, messageContent);
        }
    },
};
