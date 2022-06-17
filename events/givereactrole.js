const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require("path");

module.exports = {
    name: "messageReactionAdd",
    once: false,
    execute(reaction, user) {
        if (user.bot) return;
        
        fs.readFile(path.join(__dirname, '../data/tmpreactroles.json'), (err, jsonString) => {
            if (err) {
                console.log("Error reading file from disk:", err);
                return;
            }
            let data = JSON.parse(jsonString);

            // Check if message id is in the data
            if (!(reaction.message.id in data)) return;

            // Check if emoji is in data
            if (!data[reaction.message.id].roles[reaction.emoji.name]) return;

            // Check if emoji is ⛔ and if the user is the sender
            if (reaction.emoji.name === '⛔' && user.id) return;

            // Check if message has ⛔ reacted by the sender
            // If not assign the role to the user
            let reactions = reaction.message.reactions;
            let noEntryReact = reactions.resolve('⛔')
            let role = data[reaction.message.id].roles[reaction.emoji.name];
            if (noEntryReact) {
                noEntryReact.users.fetch().then(userList => {
                    if (userList.has(data[reaction.message.id].senderID)) {
                        reactions.resolve(reaction).users.remove(user);
                        
                        // Notify user that role was not assigned
                        let notification = new MessageEmbed()
                            .setColor('#7cd699')
                            .setTitle('Role could not be assigned')
                            .setAuthor("CSESoc Projects Bot", 'https://avatars.githubusercontent.com/u/164179?s=200&v=4')
                            .setDescription(`You can no longer reacted to the message in "${reaction.message.guild.name}" to get a role`)
                        user.send({
                            embeds: [notification]
                        })

                    } else {
                        giveRole(reaction, user, role)
                    }
                })
            } else {
                giveRole(reaction, user, role)
            }
        });
    },
};

async function giveRole(reaction, user, role) {
    reaction.message.guild.members.cache.get(user.id).roles.add(role);
    let roleName = await reaction.message.guild.roles.cache.find(r => r.id === role).name

    // Notify user role was successfully added
    let notification = new MessageEmbed()
        .setColor('#7cd699')
        .setTitle('Roles updated!')
        .setAuthor("CSESoc Projects Bot", 'https://avatars.githubusercontent.com/u/164179?s=200&v=4')
        .setDescription(`You reacted to a message in "${reaction.message.guild.name}" and was assigned the "${roleName}" role`)
    user.send({
        embeds: [notification]
    })
}