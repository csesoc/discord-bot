// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {
    name: "channelCreate",
    once: false,
    async execute(channel) {
        // creates a new text file
        await fsLibrary.writeFile('channel_create_log.txt', "Logs Channel created in the CSE discord channel", (error) => {
        
        // in case of error throw err exception
        if (error) throw err
        });

        let log = `${Date.now()} - A new channel "${channel.id}" is created - "${channel}"`
            
        // add new logged message into message_log file
        await fsLibrary.appendFile('channel_create_log.txt', log) 
    }
};