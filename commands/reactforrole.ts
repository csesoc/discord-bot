// @ts-check
import { EmbedBuilder, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";

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

    /**
     *
     * @async
     * @param {ChatInputCommandInteraction} interaction
     * @returns
     */
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild()) return;

        // Only admin users should be able to execute this command
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: "You do not have permission to execute this command.",
                ephemeral: true,
            });
        }

        const emojis = interaction.options.getString("emojis", true);
        const roleNames = interaction.options.getString("rolenames", true);

        let message = interaction.options.getString("message", true);

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

        const reactRoles = (global as any).reactRoles;

        const roles: Record<string, number> = {};

        let notificationContent = "This command: \n";

        for (let i = 0; i < roleList.length; i++) {
            const roleName = roleList[i];
            let emoji = emojiList[i];

            if (custom_emoji_regex.test(emoji!)) {
                emoji = emoji?.split(":")[1];
            }

            // Check if role exist
            /** @type {GuildMember} */
            const member: GuildMember = interaction.member;
            const role = member.guild.roles.cache.find(r => r.name === roleName);
            let roleID = 0;

            if (role) {
                const roleIsAdmin = role.permissions.has(PermissionFlagsBits.Administrator);
                if (roleIsAdmin) {
                    return await interaction.reply({
                        content: `The existing role '${roleName}' has admin permissions so this command cannot be used to give users this role`,
                        ephemeral: true,
                    });
                }
                roleID = Number(role.id);
                notificationContent += `\t'${emoji}' Used the existing role '${roleName}'\n`;
            } else {
                // Role does not exist so create one
                try {
                    const newRole = await member.guild.roles.create({
                        name: roleName!,
                        reason: `new role required for react role feature "${roleName!}"`,
                    });
                    roleID = Number(newRole.id);
                    notificationContent += `\t'${emoji}' Created the new role '${roleName}'\n`;
                } catch (err) {
                    console.log(err);
                    return await interaction.reply({
                        content: `An error occured with creating '${roleName} ${err}'`,
                        ephemeral: true,
                    });
                }
            }

            roles[emoji!] = roleID;
        }

        if (!message) {
            message = "";
        } else {
            message += "\n\n";
        }

        message += "React to give yourself a role";

        for (let j = 0; j < emojiList.length; j++) {
            message += `\n${emojiList[j]}: ${roleList[j]}`;
        }

        try {
            // Send message
            // /** @type {import("discord.js").TextBasedChannel} */
            const { channel } = interaction;
            if (!channel) return;
            // const sentMessage = await interaction.guild.channels.cache
            //     .get(interaction.channelId)
            //     .send({
            //         content: message,
            //         fetchReply: true,
            //     });

            const sentMessage = await channel.send(message);

            // Notify user that they used the command
            const botName = sentMessage.author.username;
            const notification = new EmbedBuilder()
                .setColor("#7cd699")
                .setTitle("React For Role Command Used!")
                .setAuthor({ name: botName, iconURL: "https://avatars.githubusercontent.com/u/164179?s=200&v=4" })
                .setDescription(
                    `You used the 'reactforrole' command in "${interaction.member.guild.name} \n\n` +
                    notificationContent +
                    "\nReact ⛔ on the reaction message to stop users from getting the roles",
                );
            await interaction.reply({
                embeds: [notification],
                ephemeral: true,
            });

            // Add react
            emojiList.forEach(e => sentMessage.react(e));

            // Add to database
            await reactRoles.add_react_role_msg(sentMessage.id, interaction.user.id);
            for (const e in roles) {
                await reactRoles.add_react_role_role(roles[e], e, sentMessage.id);
            }
        } catch (err) {
            console.log(err);
            return await interaction.reply({
                content: `An error occured with creating the role reaction messsage or writing to the database`,
                ephemeral: true,
            });
        }

        return Promise.resolve();
    },
};