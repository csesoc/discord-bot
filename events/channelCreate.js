// import fs module where writeFile function is defined
const fsLibrary = require('fs')

module.exports = {
    name: "channelCreate",
    once: false,
    async execute(channel) {
        console.log(channel)
        const logDB = global.logDB;
        logDB.channel_add(channel.id, channel.name, channel.guild.id)
    }
};