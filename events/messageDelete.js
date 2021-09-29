// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {
    name: "messageDelete",
    once: false,
    async execute(message) {
        // creates a new text file
        await fsLibrary.writeFile('message_delete_log.txt', "Deleted messages logs from CSE discord channel", (error) => {
        
        // in case of error throw err exception
        if (error) throw err
        });

        // ignore messages sent from bot
        if (message.author.bot) {return;}

        let log = `${Date.now()} - A message by ${message.author.id} was deleted in channel ${message.channelId}`
            
        // add new logged message into message_log file
        await fsLibrary.appendFile('message_delete_log.txt', log)
    }
};