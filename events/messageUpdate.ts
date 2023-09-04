export const messageUpdate = {
    name: "messageUpdate",
    async execute(_oldMessage: any, message: any): Promise<void> {
        // console.log(message);
        if (message.author.bot) {
            return;
        }
  
        const standupDB = global.standupDBGlobal;
  
        const logDB = global.logDB;
        logDB.message_update(_oldMessage.id, message.id, message.content);
  
        if (message.content.startsWith("$standup")) {
            const messages: string = String(message.content);
            const messageContent: string = messages.slice(8).trim();
    
            const teamId: string = message.channel.parentId;
    
            const standupAuthorId: string = message.author.id;
    
            const standupExists: boolean = await standupDB.thisStandupExists(message.id);
            const numDaysToRetrieve: number = 7;
            const alreadyStandup: Standup[] = await standupDB.getStandups(teamId, numDaysToRetrieve);
    
            alreadyStandup.filter((st: Standup) => st.user_id === message.author.id);
            const latestStandup: Date = new Date(_oldMessage.createdTimestamp);
  
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
  
interface Standup {
    user_id: string;
    time_stamp: Date;
}
