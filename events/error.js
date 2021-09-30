// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {

    name: "error",
    once: false,
    async execute(error) {

        let log = `${Date.now()} - error: "${error.name}" - "${error} in "${Guild.name}"`
            
        // add new logged message into message_log file
        await fsLibrary.appendFile('error_log.txt', log)
    }

};
