// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {
    name: "channelDelete",
    once: false,
    async execute(channel) {
        // creates a new text file
        await fsLibrary.writeFile('channel_delete_log.txt', "Logs Channel deleted in the CSE discord channel", (error) => {
        
        // in case of error throw err exception
        if (error) throw err
        });

        let log = `${Date.now()} - The channel "${channel.id}" is deleted - "${channel}"`
            
        // add new logged message into message_log file
        await fsLibrary.appendFile('channel_delete_log.txt', log) 
    }
};