// import fs module where writeFile function is defined
const fsLibrary = require('fs')
const { allowedChannels } = require("../config/anon_channel.json");
const fs = require('fs');

module.exports = {
    name: "channelDelete",
    once: false,
    async execute(channel) {
        const logDB = global.logDB;
        logDB.channel_delete(channel.id)
        //console.log("deleted channel "+channel.id+channel.name)
        if (allowedChannels.some(c => c === channel.id)) {
            allowedChannels.splice(allowedChannels.indexOf(channel.id), 1);

            // The path here is different to the require because it's called from index.js (I think)
            fs.writeFileSync("./config/anon_channel.json", JSON.stringify({ allowedChannels: allowedChannels }, null, 4));
        }
    }
};