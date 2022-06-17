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
            .setRequired(true)
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
        const messsage = interaction.options.getString('message');

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
        const unicode_emoji_regex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])$/;
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
                senderID: interaction.user.id,
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
            
            // Send message
            const sentMessage = await interaction.reply({
                content: messsage,
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