// import fs module where writeFile function is defined
const fsLibrary = require("fs");
const { DBlog } = require("../lib/database/dblog");

module.exports = {
    name: "messageDelete",
    once: false,
    async execute(message) {
        // ignore messages sent from bot
        if (message.author.bot) {
            return;
        }

        const logDB = global.logDB;
        logDB.message_delete(message.id);
    },
};
