// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {

    name: "shardError",
    once: false,
    async execute(error) {

        let log = `${Date.now()} - A websocket connection encountered an error: "${error}"`
            
        // add new logged message into message_log file
        await fsLibrary.appendFile('error_log.txt', log)
    }

};
