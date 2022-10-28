const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("role")
        .setDescription("Manages roles.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("give")
                .setDescription("Gives a role to the user.")
                .addRoleOption((option) =>
                    option.setName("role").setDescription("Role to give").setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Removes a role from the user.")
                .addRoleOption((option) =>
                    option.setName("role").setDescription("Role to remove").setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("count")
                .setDescription("[ADMIN] Displays the number of members with a role.")
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setDescription("Role to count members")
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("removeunverified")
                .setDescription("[ADMIN] Removes all members with the unverified role."),
        ),
    async execute(interaction) {
        try {
            const reg_comp_course = /^comp\d{4}$/;
            const reg_math_course = /^math\d{4}$/;
            const reg_binf_course = /^binf\d{4}$/;
            const reg_engg_course = /^engg\d{4}$/;
            const reg_seng_course = /^seng\d{4}$/;
            const reg_desn_course = /^desn\d{4}$/;

            if (interaction.options.getSubcommand() === "give") {
                const role = await interaction.options.getRole("role");

                if (
                    !reg_comp_course.test(role.name.toLowerCase()) &&
                    !reg_math_course.test(role.name.toLowerCase()) &&
                    !reg_binf_course.test(role.name.toLowerCase()) &&
                    !reg_engg_course.test(role.name.toLowerCase()) &&
                    !reg_seng_course.test(role.name.toLowerCase()) &&
                    !reg_desn_course.test(role.name.toLowerCase())
                ) {
                    return await interaction.reply({
                        content: `❌ | You are not allowed to give yourself the role \`${role.name}\`.`,
                        ephemeral: true,
                    });
                } else if (interaction.member.roles.cache.some((r) => r === role)) {
                    return await interaction.reply({
                        content: `❌ | You already have the role \`${role.name}\`.`,
                        ephemeral: true,
                    });
                }

                await interaction.member.roles.add(role);

                return await interaction.reply({
                    content: `✅ | Gave you the role \`${role.name}\`.`,
                    ephemeral: true,
                });
            } else if (interaction.options.getSubcommand() === "remove") {
                const role = await interaction.options.getRole("role");

                if (
                    !reg_comp_course.test(role.name.toLowerCase()) &&
                    !reg_math_course.test(role.name.toLowerCase()) &&
                    !reg_binf_course.test(role.name.toLowerCase()) &&
                    !reg_engg_course.test(role.name.toLowerCase()) &&
                    !reg_seng_course.test(role.name.toLowerCase()) &&
                    !reg_desn_course.test(role.name.toLowerCase())
                ) {
                    return await interaction.reply({
                        content: `❌ | You are not allowed to remove the role \`${role.name}\`.`,
                        ephemeral: true,
                    });
                } else if (!interaction.member.roles.cache.some((r) => r === role)) {
                    return await interaction.reply({
                        content: `❌ | You do not have the role \`${role.name}\`.`,
                        ephemeral: true,
                    });
                }

                await interaction.member.roles.remove(role);

                return await interaction.reply({
                    content: `✅ | Removed the role \`${role.name}\`.`,
                    ephemeral: true,
                });
            }

            // Admin permission check
            if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                return await interaction.reply({
                    content: "You do not have permission to execute this command.",
                    ephemeral: true,
                });
            }

            if (interaction.options.getSubcommand() === "count") {
                const role = await interaction.options.getRole("role");

                return await interaction.reply(
                    `There are ${role.members.size} members with the role \`${role.name}\`.`,
                );
            } else if (interaction.options.getSubcommand() === "removeunverified") {
                const role = await interaction.guild.roles.cache.find(
                    (r) => r.name.toLowerCase() === "unverified",
                );

                // Make sure that the "unverified" role exists
                if (role === undefined) {
                    return await interaction.reply('Error: no "unverified" role exists.');
                }

                const kickMessage =
                    "You have been removed from the CSESoc Server as you have not verified via the instructions in #welcome";

                // Member list in the role is cached
                let numRemoved = 0;
                await role.members.each((member) => {
                    member.createDM().then((DMChannel) => {
                        // Send direct message to user being kicked
                        DMChannel.send(kickMessage).then(() => {
                            // Message sent, time to kick.
                            member
                                .kick(kickMessage)
                                .then(() => {
                                    ++numRemoved;
                                    console.log(numRemoved + " people removed.");
                                })
                                .catch((e) => {
                                    console.log(e);
                                });
                        });
                    });
                });
                return await interaction.reply("Removed unverified members.");
            } else {
                return await interaction.reply("Error: invalid subcommand.");
            }
        } catch (error) {
            await interaction.reply("Error: " + error);
        }
    },
};
