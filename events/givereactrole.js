const { Emoji } = require("discord.js");
const fs = require('fs');
const path = require("path");

module.exports = {
    name: "messageReactionAdd",
    once: false,
    execute(reaction, user) {
        console.log(reaction)
        fs.readFile(path.join(__dirname, '../data/tmpreactroles.json'), (err, jsonString) => {
            if (err) {
                console.log("Error reading file from disk:", err);
                return;
            }

            let data = JSON.parse(jsonString);
            
            // BIG PROBLEMOS HERE
            for (const tmpRole in data) {
                if (reaction.emoji.name == tmpRole.emoji && reaction.message.id === tmpRole.messageID) {
                    client.guilds.fetch(reaction.guildId).then(guild => {
                        guild.fetchMember(user) // fetch the user that reacted
                        .then((member) => 
                        {
                            let role = (guild.roles.find(role => role.name === tmpRole));
                            member.addRole(role)
                            .then(() => 
                                {
                                    console.log(`Added the role to ${member.displayName}`);
                                }
                            );
                        });
                    })
                    
                }
            }
        });
    },
};
