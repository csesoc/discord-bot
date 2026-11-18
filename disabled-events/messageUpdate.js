module.exports = {
    name: "messageUpdate",
    async execute(_oldMessage, message) {
        // console.log(message);
        if (message.author.bot == true) {
            return;
        }
        const standupDB = global.standupDBGlobal;

        const logDB = global.logDB;
        logDB.message_update(_oldMessage.id, message.id, message.content);

        if (message.content.startsWith("$standup")) {
            const messages = String(message.content);
            const messageContent = messages.slice(8).trim();

            const teamId = message.channel.parentId;

            const standupAuthorId = message.author.id;

            const standupExists = await standupDB.thisStandupExists(message.id);
            const numDaysToRetrieve = 7;
            const alreadyStandup = await standupDB.getStandups(teamId, numDaysToRetrieve);

            alreadyStandup.filter((st) => st.user_id == message.author.id);
            const latestStandup = new Date(_oldMessage.createdTimestamp);

            // if this standup exists, update the row else insert new row
            if (standupExists) {
                await standupDB.updateStandup(message.id, messageContent);
            } else if (latestStandup > alreadyStandup[0].time_stamp) {
                await standupDB.addStandup(teamId, standupAuthorId, message.id, messageContent);
            }

            // const mentions = message.mentions.users;
            // const mentionsArr = [...mentions.values()];

            // Contains the list of all users mentioned in the message
            // const result = mentionsArr.map((a) => a.id);
        }
    },
};
