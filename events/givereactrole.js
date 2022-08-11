const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require("path");

module.exports = {
    name: "messageReactionAdd",
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

        fs.readFile(path.join(__dirname, '../data/tmpreactroles.json'), (err, jsonString) => {
            if (err) {
                console.log("Error reading file from disk:", err);
                return;
            } else {
                let data = JSON.parse(jsonString);
    
                let messageId = reaction.message.id;
                
                // Check if message id is in the data
                if (!(messageId in data)) return;
                
                let role = data[messageId].roles[reaction.emoji.name];
                
                // Check if emoji is in data
                if (!role) return;
                
                let senderId = data[messageId].senderId;
    
                // Check if emoji is ⛔ and if the user is the sender
                if (reaction.emoji.name === '⛔' && user.id === senderId) return;
    
                // Check if message has ⛔ reacted by the sender
                // If not assign the role to the user
                
                let reactions = reaction.message.reactions;
                let noEntryReact = reactions.resolve('⛔');
                if (noEntryReact) {
                    noEntryReact.users.fetch().then(async userList => {
                        if (userList.has(data[messageId].senderId)) {
                            reactions.resolve(reaction).users.remove(user);
                            
                            let botName = await reaction.message.author.username;
    
                            // Notify user that role was not assigned
                            let notification = new MessageEmbed()
                                .setColor('#7cd699')
                                .setTitle('Role could not be assigned')
                                .setAuthor(botName, 'https://avatars.githubusercontent.com/u/164179?s=200&v=4')
                                .setDescription(`You can no longer react to the message in "${reaction.message.guild.name}" to get a role`)
                            user.send({
                                embeds: [notification]
                            })
                        } else {
                            giveRole(reaction, user, role);
                        }
                    })
                } else {
                    giveRole(reaction, user, role);
                }
            }
        });
    },
};

async function giveRole(reaction, user, role) {
    try {
        reaction.message.guild.members.cache.get(user.id).roles.add(role);
        let roleName = await reaction.message.guild.roles.cache.find(r => r.id === role).name;
        let botName = await reaction.message.author.username;
    
        // Notify user role was successfully added
        let notification = new MessageEmbed()
            .setColor('#7cd699')
            .setTitle('Roles updated!')
            .setAuthor(botName, 'https://avatars.githubusercontent.com/u/164179?s=200&v=4')
            .setDescription(`You reacted to a message in "${reaction.message.guild.name}" and was assigned the "${roleName}" role`)
        user.send({
            embeds: [notification]
        })
    } catch (err) {
        console.log(err)
    }
}