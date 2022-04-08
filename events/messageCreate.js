// const { Client, Guild } = require('discord.js');
// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {
    name: "messageCreate",
    once: false,
    async execute(message) {
        // creates a new text file
        fsLibrary.appendFileSync('./message_log.txt', "Messages logs from CSE discord channel\n");

        // ignore messages sent from bot
        if (message.author.bot) {return;}

        let log = `${Date.now()} - ${message.author.id} sent "${message.content}" in "${message.channelId}"`
            
        // add new logged message into message_log file
        fsLibrary.appendFileSync('./message_log.txt', log+"\n");
        console.log("gets here");
    }
};
