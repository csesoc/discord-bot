const fsLibrary = require('fs')

module.exports = {
    name: "channelUpdate",
    once: false,
    async execute(channel) {
        const logDB = global.logDB;
        old_name = await logDB.channelname_get(channel.id);
        
        if(old_name != channel.name){
            await logDB.channelname_update(channel.name, channel.id);
        }
    }
};