const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require("path");

module.exports = {
    name: "messageReactionRemove",
    once: false,
    async execute(reaction, user) {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }

        fs.readFile(path.join(__dirname, '../data/tmpreactroles.json'), async (err, jsonString) => {
            if (err) {
                console.log("Error reading file from disk:", err);
                return;
            } else {
                let data = JSON.parse(jsonString);

                // Check if message id is in the data
                if (!(reaction.message.id in data)) return;

                let role = data[reaction.message.id].roles[reaction.emoji.name];

                // Check if emoji is in data
                if (!role) return;

                let noEntryReact = reaction.message.reactions.resolve('⛔')
                if (noEntryReact) {
                    try {
                        noEntryReact.users.fetch().then(async userList => {
                            let hasRole = await reaction.message.guild.members.cache.get(user.id)._roles.includes(role);
                            if (!userList.has(data[reaction.message.id].senderId) || hasRole) {
                                removeRole(reaction, user, role)
                            }
                        });
                    } catch (err) {
                        console.log(err)
                    }
                } else {
                    removeRole(reaction, user, role)
                }
            }
        });
    },
};

async function removeRole(reaction, user, role) {
    try {
        reaction.message.guild.members.cache.get(user.id).roles.remove(role);
        let roleName = await reaction.message.guild.roles.cache.find(r => r.id === role).name
        let botName = await reaction.message.author.username;

        // Notify user role was successfully removed
        let notification = new MessageEmbed()
            .setColor('#7cd699')
            .setTitle('Roles updated!')
            .setAuthor(botName, 'https://avatars.githubusercontent.com/u/164179?s=200&v=4')
            .setDescription(`You unreacted to a message in "${reaction.message.guild.name}" and was unassigned the "${roleName}" role`)
        user.send({
            embeds: [notification]
        })
    } catch (err) {
        console.log(err)
    }
}