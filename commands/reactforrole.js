const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions, MessageEmbed } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reactforrole")
        .setDescription("Creates a new role and assigns role to anyone who reacts with given emoji")
        .addStringOption((option) =>
            option
                .setName("emojis")
                .setDescription(
                    "Enter one or more emojis users will use to gain the new role separated by commas (e.g. emoji,emoji)",
                )
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("rolenames")
                .setDescription(
                    "Enter the names of the roles separated by commas (e.g. rolename,rolename)",
                )
                .setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("message").setDescription("Enter your message"),
        ),

    async execute(interaction) {
        // Only admin users should be able to execute this command
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({
                content: "You do not have permission to execute this command.",
                ephemeral: true,
            });
        }

        const emojis = interaction.options.getString("emojis");
        const roleNames = interaction.options.getString("rolenames");
        var message = interaction.options.getString("message");

        const emojiList = emojis.split(",").map((item) => item.trim());
        const roleList = roleNames.split(",").map((item) => item.trim());

        // Check emojis are unique
        if (emojiList.length !== new Set(emojiList).size) {
            return await interaction.reply({
                content: "Please enter unique emojis",
                ephemeral: true,
            });
        }

        // Check all emojis are valid
        const unicode_emoji_regex =
            /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
        const custom_emoji_regex = /^<:.*:\d{18}>$/;
        for (const element of emojiList) {
            if (!unicode_emoji_regex.test(element) && !custom_emoji_regex.test(element)) {
                return await interaction.reply({
                    content: "Please enter emojis only separated by commas e.g. emoji,emoji",
                    ephemeral: true,
                });
            }
        }

        // Check if rolenames and emojis correspond
        if (emojiList.length != roleList.length) {
            return await interaction.reply({
                content:
                    "Please have a rolename correspond to each emoji, ensure emojis and role names are separated by commas",
                ephemeral: true,
            });
        }

        const reactRoles = global.reactRoles;

        const roles = {};

        var notificationContent = "This command: \n";

        for (var i = 0; i < roleList.length; i++) {
            const roleName = roleList[i];
            var emoji = emojiList[i];

            if (custom_emoji_regex.test(emoji)) {
                emoji = emoji.split(":")[1];
            }

            // Check if role exist
            const role = interaction.member.guild.roles.cache.find((r) => r.name === roleName);
            var roleID = 0;

            if (role) {
                const roleIsAdmin = role.permissions.has("ADMINISTRATOR");
                if (roleIsAdmin) {
                    return await interaction.reply({
                        content: `The existing role '${roleName}' has admin permissions so this command cannot be used to give users this role`,
                        ephemeral: true,
                    });
                }
                roleID = role.id;
                notificationContent += `\t'${emoji}' Used the existing role '${roleName}'\n`;
            } else {
                // Role does not exist so create one
                try {
                    const newRole = await interaction.member.guild.roles.create({
                        name: roleName,
                        reason: `new role required for react role feature "${roleName}"`,
                    });
                    roleID = newRole.id;
                    notificationContent += `\t'${emoji}' Created the new role '${roleName}'\n`;
                } catch (err) {
                    console.log(err);
                    return await interaction.reply({
                        content: `An error occured with creating '${roleName}'`,
                        ephemeral: true,
                    });
                }
            }

            roles[emoji] = roleID;
        }

        if (!message) {
            message = "";
        } else {
            message += "\n\n";
        }

        message += "React to give yourself a role";
        for (var j = 0; j < emojiList.length; j++) {
            message += `\n${emojiList[j]}: ${roleList[j]}`;
        }

        try {
            // Send message
            const sentMessage = await interaction.guild.channels.cache
                .get(interaction.channelId)
                .send({
                    content: message,
                    fetchReply: true,
                });

            // Notify user that they used the command
            const botName = sentMessage.author.username;
            const notification = new MessageEmbed()
                .setColor("#7cd699")
                .setTitle("React For Role Command Used!")
                .setAuthor(botName, "https://avatars.githubusercontent.com/u/164179?s=200&v=4")
                .setDescription(
                    `You used the 'reactforrole' command in "${interaction.member.guild.name} \n\n` +
                        notificationContent +
                        "\nReact ⛔ on the reaction message to stop users from getting the roles",
                );
            interaction.reply({
                embeds: [notification],
                ephemeral: true,
            });

            // Add react
            emojiList.forEach((emoji) => {
                sentMessage.react(emoji);
            });

            // Add to database
            await reactRoles.add_react_role_msg(sentMessage.id, interaction.user.id);
            for (const emoji in roles) {
                await reactRoles.add_react_role_role(roles[emoji], emoji, sentMessage.id);
            }
        } catch (err) {
            console.log(err);
            return await interaction.reply({
                content: `An error occured with creating the role reaction messsage or writing to the database`,
                ephemeral: true,
            });
        }
    },
};
