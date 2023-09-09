import { Events } from "discord.js";

function messagelog(message: any): void {
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
        message.channelId
    );
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message: any): Promise<void> {
        const standupDB = global.standupDBGlobal;
        messagelog(message);

        if (message.content.startsWith("$standup")) {
            // Get standup content
            const messages: string = String(message.content);
            const messageContent: string = messages.slice(8).trim();
            const teamId: string = message.channel.parentId;
            const standupAuthorId: string = message.author.id;

            await standupDB.addStandup(teamId, standupAuthorId, message.id, messageContent);
        }
    },
};
