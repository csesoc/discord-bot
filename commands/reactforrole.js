const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reactforrole")
        .setDescription("Users can react for a temporary role")
        .addSubcommand(subcommand => 
            subcommand
                .setName("create")
                .setDescription("Creates a new text channel and assigns role to anyone who reacts with given emoji")
                .addStringOption(option => 
                    option
                    .setName('emoji')
                    .setDescription("Enter the emoji users will use to gain the new role")
                    .setRequired(true)
                )
                .addStringOption(option => 
                    option
                    .setName('rolename')
                    .setDescription("Enter the name of the role")
                    .setRequired(true)
                )
                .addStringOption(option => 
                    option
                    .setName('message')
                    .setDescription("Enter your message")
                    .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName("remove")
                .setDescription("Removes role created using the reactforrole create command")
                .addStringOption(option => 
                    option
                    .setName('rolename')
                    .setDescription("Enter the name of the role to be removed")
                    .setRequired(true)
                )
        ),

    async execute(interaction) {
        // Only admin users should be able to execute this command
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({ 
                content: "You do not have permission to execute this command.", 
                ephemeral: true 
            });
        }

        const command = interaction.options.getSubcommand();
        
        if (command === "create") {

            const emoji = interaction.options.getString('emoji');
            const roleName = interaction.options.getString('rolename');
            const messsage = interaction.options.getString('message');

            // Check if emoji input is an emoji
            var emoji_regex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])$/;
            if (!emoji_regex.test(emoji)) {
                return await interaction.reply({
                    content: "Please enter one unicode emoji character only.",
                    ephemeral: true
                });
            }

            fs.readFile(path.join(__dirname, '../data/tmpreactroles.json'), async (err, jsonString) => {
                if (err) {
                    console.log("Error reading file from disk:", err);
                    return;
                }
                else {
                    let data = JSON.parse(jsonString);

                     // Check if rolename already exists
                    if (roleName in data) {
                        return await interaction.reply({
                            content: "This role already exists",
                            ephemeral: true
                        });
                    }

                    // Send message
                    const sent_message = await interaction.reply({
                        content: messsage,
                        fetchReply: true
                    });

                    // Add react
                    sent_message.react(emoji)

                    // Add to data
                    data[roleName] = {
                        messageID: sent_message.id,
                        emoji: emoji
                    };

                    jsonData = JSON.stringify(data);
                    fs.writeFile(path.join(__dirname, '../data/tmpreactroles.json'), jsonData, function(err) {
                        if (err) {
                            console.log(err);
                        }
                    })
                }
            });

            // Create a new role with data and a reason
            interaction.member.guild.roles.create({
                name: roleName,
                reason: `we needed this cool new role "${roleName}"`,
            }).catch(console.error);

            // Create channel
            let name = interaction.user.username;
            interaction.member.guild.channels.create(roleName)
                .catch(console.error);

        } else if (command === "remove") {

            const roleName = interaction.option.getString('rolename');

        }


    },
};
