const fsLibrary = require('fs')
const { DBlog } = require("../lib/database/dblog");

module.exports = {
    name: "messageUpdate",
    once: false,
    async execute(oldMessage, newMessage) {
        // ignore messages sent from bot
        if (newMessage.author.bot == true) {return;}

        const logDB = global.logDB;
        logDB.message_update(oldMessage.id, newMessage.id, newMessage.content);
    }
};