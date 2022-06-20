const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require("path");

module.exports = {
    name: "messageReactionRemove",
    once: false,
    execute(reaction, user) {
        if (user.bot) return;

        fs.readFile(path.join(__dirname, '../data/tmpreactroles.json'), async (err, jsonString) => {
            if (err) {
                console.log("Error reading file from disk:", err);
                return;
            }
            let data = JSON.parse(jsonString);

            // Check if message id is in the data
            if (!(reaction.message.id in data)) return;

            let role = data[reaction.message.id].roles[reaction.emoji.name];

            // Check if emoji is in data
            if (!role) return;

            // let noEntryReact = reaction.message.reactions.resolve('⛔')
            // if (noEntryReact) {
            //     noEntryReact.users.fetch().then(userList => {
            //         if (!userList.has(data[reaction.message.id].senderID)) {
            //             removeRole(reaction, user, role)
            //         }
            //     })
            // } else {
            //     removeRole(reaction, user, role)
            // }
            
            removeRole(reaction, user, role)
        })
    },
};

async function removeRole(reaction, user, role) {
    reaction.message.guild.members.cache.get(user.id).roles.remove(role);
    let roleName = await reaction.message.guild.roles.cache.find(r => r.id === role).name

    // Notify user role was successfully removed
    let notification = new MessageEmbed()
        .setColor('#7cd699')
        .setTitle('Roles updated!')
        .setAuthor("CSESoc Projects Bot", 'https://avatars.githubusercontent.com/u/164179?s=200&v=4')
        .setDescription(`You unreacted to a message in "${reaction.message.guild.name}" and was unassigned the "${roleName}" role`)
    user.send({
        embeds: [notification]
    })
}