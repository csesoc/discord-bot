// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {
    name: "guildMemberAdd",
    once: false,
    async execute(member) {
        // creates a new text file
        await fsLibrary.writeFile('members_add_log.txt', "Logs new members added in the CSE discord channel", (error) => {
        
        // in case of error throw err exception
        if (error) throw err
        });

        let log = `${Date.now()} - ${member.id} has joined the guild ${Guild.name}`
            
        // add new logged message into message_log file
        await fsLibrary.appendFile('members_add_log.txt', log) 
    }
};