// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {
    name: "messageDelete",
    once: false,
    async execute(message) {
        // creates a new text file
        fsLibrary.appendFileSync('message_delete_log.txt', "Deleted messages logs from CSE discord channel\n");

        // ignore messages sent from bot
        console.log(message.author.bot)
        if (message.author.bot == true) {return;}

        let log = `${Date.now()} - A message by ${message.author.id} was deleted in channel ${message.channelId}`
            
        // add new logged message into message_log file
        fsLibrary.appendFileSync('message_delete_log.txt', log+"\n");
    }
};