const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reactforrole")
        .setDescription("Creates a new role and assigns role to anyone who reacts with given emoji")
        .addStringOption(option => 
            option
            .setName('emojis')
            .setDescription("Enter one or more emojis users will use to gain the new role separated by commas (e.g. emoji,emoji)")
            .setRequired(true)
        )
        .addStringOption(option => 
            option
            .setName('rolenames')
            .setDescription("Enter the names of the roles separated by commas (e.g. rolename,rolename)")
            .setRequired(true)
        )
        .addStringOption(option => 
            option
            .setName('message')
            .setDescription("Enter your message")
        ),

    async execute(interaction) {
        // Only admin users should be able to execute this command
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({ 
                content: "You do not have permission to execute this command.", 
                ephemeral: true 
            });
        }

        const emojis = interaction.options.getString('emojis');
        const roleNames = interaction.options.getString('rolenames');
        let message = interaction.options.getString('message');

        const emojiList = emojis.split(",").map(item => item.trim());
        const roleList = roleNames.split(",").map(item => item.trim());
        
        // Check emojis are unique
        if (emojiList.length !== new Set(emojiList).size) {
            return await interaction.reply({
                content: "Please enter unique emojis",
                ephemeral: true
            });
        }

        // Check all emojis are valid
        const unicode_emoji_regex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/
        const custom_emoji_regex = /^<:.*:\d{18}>$/
        for (element of emojiList) {
            if (!unicode_emoji_regex.test(element) && !custom_emoji_regex.test(element)) {
                return await interaction.reply({
                    content: "Please enter emojis only separated by commas e.g. emoji,emoji",
                    ephemeral: true
                });
            }
        }

        // Check if rolenames and emojis correspond 
        if (emojiList.length != roleList.length) {
            return await interaction.reply({
                content: "Please have a rolename correspond to each emoji, ensure emojis and role names are separated by commas",
                ephemeral: true
            });
        }

        fs.readFile(path.join(__dirname, '../data/tmpreactroles.json'), async (err, jsonString) => {
            if (err) {
                console.log("Error reading file from disk:", err);
                return;
            }
            let data = JSON.parse(jsonString);

            messageInfo = {
                senderId: interaction.user.id,
                roles: {}
            };

            for (let i = 0; i < roleList.length; i++) {
                let roleName = roleList[i];
                let emoji = emojiList[i];
                
                // Check if role exist
                let role = interaction.member.guild.roles.cache.find(role => role.name === roleName);
                let roleID;

                if (role) {
                    roleID = role.id;
                } else {
                    // Role does not exist so create one
                    let newRole = await interaction.member.guild.roles.create({
                        name: roleName,
                        reason: `we needed this cool new role "${roleName}"`,
                    }).catch(console.error);

                    roleID = newRole.id;
                }
                messageInfo.roles[emoji] = roleID;
            } 

            if (!message) {
                message = "";
            } else {
                message += '\n\n';
            }
            
            message += "React to give yourself a role";
            for (let i = 0; i < emojiList.length; i++) {
                message += `\n${emojiList[i]}: ${roleList[i]}`
            }
            
            // Send message
            const sentMessage = await interaction.reply({
                content: message,
                fetchReply: true
            });

            // Add react
            emojiList.forEach(emoji => {
                sentMessage.react(emoji)
            });
            
            // Add to data
            data[sentMessage.id] = messageInfo;
            
            jsonData = JSON.stringify(data);
            fs.writeFile(path.join(__dirname, '../data/tmpreactroles.json'), jsonData, function(err) {
                if (err) {
                    console.log(err);
                }
            })
        });
    },
};