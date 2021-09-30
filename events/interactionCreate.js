// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {

    name: "interactionCreate",
    once: false,
    async execute(message) {

        // if it is not a command, log the user command error
        if (!interaction.isCommand()) {
            await fsLibrary.writeFile('command_error_log.txt', "Logs command errors entered in the CSE discord channel", (error) => {
        
                // in case of error throw err exception
                if (error) throw err
            });

            let log = `${Date.now()} - ${message.author.id} typed incorrect command "${message.content}" in "${message.channelId}"`
            
            // add new logged message into message_log file
            await fsLibrary.appendFile('command_error_log.txt', log)
        }

        let log = `${Date.now()} - ${message.author.id} typed command "${message.content}" in "${message.channelId}"`
            
        // add new logged message into message_log file
        await fsLibrary.appendFile('interaction_create_log.txt', log)
    }

};
