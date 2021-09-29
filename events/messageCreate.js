// const { Client, Guild } = require('discord.js');
// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {
    name: "messageCreate",
    once: false,
    async execute(message) {
        // creates a new text file
        await fsLibrary.writeFile('message_log.txt', "Messages logs from CSE discord channel", (error) => {
        
        // in case of error throw err exception
        if (error) throw err
        });

        // ignore messages sent from bot
        if (message.author.bot) {return;}

        let log = `${Date.now()} - ${message.author.id} sent "${message.content}" in "${message.channelId}"`
            
        // add new logged message into message_log file
        await fsLibrary.appendFile('message_log.txt', log) 
    }
};
