const { DBlog } = require("../lib/database/dblog");
const { allowedChannels } = require("../config/anon_channel.json");
const fs = require('fs');

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        const guilds = client.guilds.cache.map(guild => guild.id);
        const logDB = new DBlog();
        global.logDB = logDB;

        const courses = ["comp", "seng", "binf", "engg", "math"]


        function checkCourse(c_name, courses) {
            return courses.some(c => c_name.startsWith(c.toLowerCase()));
        }

        (async() => {
            await logDB.create_tables();
            for(let i = 0; i < guilds.length; i++) {

                let g = client.guilds.cache.get(guilds[i])
                let channels = g.channels.cache

                channels_arr = [...channels.values()]
                channels_filtered = channels_arr.filter((c) => (c.type === "GUILD_TEXT"))

                for(let m in channels_filtered){
                    //console.log(channels_filtered[m].id, channels_filtered[m].name);
                    c_name = channels_filtered[m].name;
                    c_id = channels_filtered[m].id;

                    if(checkCourse(c_name, courses)){
                        if (!allowedChannels.some(c => c === c_id)) {
                            allowedChannels.push(c_id);
                            fs.writeFileSync("./config/anon_channel.json", JSON.stringify({ allowedChannels: allowedChannels }, null, 4));
                        }
                    }

                    logDB.channel_add(c_id, c_name, g.id)
                }
            }
        })();
    },
};