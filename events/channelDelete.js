// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {
    name: "channelDelete",
    once: false,
    async execute(channel) {
        const logDB = global.logDB;
        logDB.channel_delete(channel.id)
        console.log("deleted channel"+channel.id)
    }
};