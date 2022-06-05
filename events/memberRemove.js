// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {
    name: "guildMemberRemove",
    once: false,
    async execute(member) {
        // creates a new text file
        await fsLibrary.writeFile('members_remove_log.txt', "Logs members that have left in the CSE discord channel", (error) => {
        
        // in case of error throw err exception
        if (error) throw err
        });

        let log = `${Date.now()} - ${member.id} left the guild ${Guild.name}`
            
        // add new logged message into message_log file
        await fsLibrary.appendFile('members_remove_log.txt', log) 
    }
};