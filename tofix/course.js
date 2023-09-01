const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");

const MODERATION_REQUEST_CHANNEL = 824506830641561600;
const COMMAND_JOIN = "join";
const COMMAND_LEAVE = "leave";

// map of course aliases to their actual names
const course_aliases = {
    comp6841: "comp6441",
    comp9044: "comp2041",
    comp3891: "comp3231",
    comp9201: "comp3231",
    comp9101: "comp3121",
    comp9331: "comp3331",
    comp9415: "comp3421",
    comp9801: "comp3821",
    comp9102: "comp3131",
    comp9154: "comp3151",
    comp9164: "comp3161",
    comp9211: "comp3211",
    comp9222: "comp3221",
    comp9814: "comp3411",
    comp9511: "comp3511",
    comp9900: "comp3900",
    seng4920: "comp4920",
    comp9337: "comp4337",
    math1141: "math1131",
    math1241: "math1231",
};

const get_real_course_name = (course) => {
    if (course_aliases[course.toLowerCase()]) {
        return course_aliases[course.toLowerCase()];
    }
    return course.toLowerCase();
};

const is_valid_course = (course) => {
    const reg_comp_course = /^comp\d{4}$/;
    const reg_math_course = /^math\d{4}$/;
    const reg_binf_course = /^binf\d{4}$/;
    const reg_engg_course = /^engg\d{4}$/;
    const reg_seng_course = /^seng\d{4}$/;
    const reg_desn_course = /^desn\d{4}$/;

    return (
        reg_comp_course.test(course.toLowerCase()) ||
        reg_math_course.test(course.toLowerCase()) ||
        reg_binf_course.test(course.toLowerCase()) ||
        reg_engg_course.test(course.toLowerCase()) ||
        reg_seng_course.test(course.toLowerCase()) ||
        reg_desn_course.test(course.toLowerCase())
    );
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("course")
        .setDescription("Manages course chats.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName(COMMAND_JOIN)
                .setDescription("Join a course chat.")
                .addStringOption((option) =>
                    option
                        .setName("course")
                        .setDescription("Course chat to join")
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName(COMMAND_LEAVE)
                .setDescription("Leave a course chat.")
                .addStringOption((option) =>
                    option
                        .setName("course")
                        .setDescription("Course chat to leave")
                        .setRequired(true),
                ),
        ),
    async execute(interaction) {
        try {
            if (interaction.options.getSubcommand() === COMMAND_JOIN) {
                const input_course = await interaction.options.getString("course").toLowerCase();
                const course = get_real_course_name(input_course);

                const other_courses = /^[a-zA-Z]{4}\d{4}$/;
                const is_valid = is_valid_course(course);

                const course_with_alias =
                    course != input_course
                        ? `${course} (same course chat as ${input_course})`
                        : `${course}`;

                if (!is_valid && other_courses.test(course.toLowerCase())) {
                    return await interaction.reply({
                        content: `❌ | Course chats for other faculties are not supported.`,
                        ephemeral: true,
                    });
                } else if (!is_valid) {
                    return await interaction.reply({
                        content: `❌ | You are not allowed to join this channel using this command.`,
                        ephemeral: true,
                    });
                }

                // First, let's see if there's a role that matches the name of the course
                const role = await interaction.guild.roles.cache.find(
                    (r) => r.name.toLowerCase() === course.toLowerCase(),
                );

                // If there is, let's see if the member already has that role
                if (role !== undefined) {
                    if (interaction.member.roles.cache.has(role.id)) {
                        return await interaction.reply({
                            content: `❌ | You are already in the course chat for \`${course_with_alias}\`.`,
                            ephemeral: true,
                        });
                    }

                    // If they don't, let's add the role to them
                    await interaction.member.roles.add(role);
                    return await interaction.reply({
                        content: `✅ | Added you to the chat for \`${course_with_alias}\`.`,
                        ephemeral: true,
                    });
                }

                // Otherwise, find a channel with the same name as the course
                const channel = await interaction.guild.channels.cache.find(
                    (c) => c.name.toLowerCase() === course.toLowerCase(),
                );

                // Make sure that the channel exists, and is a text channel
                if (channel === undefined) {
                    return await interaction.reply({
                        content: `❌ | The course chat for \`${course}\` does not exist. If you'd like for it to be created, please raise a ticket in <#${MODERATION_REQUEST_CHANNEL}>.`,
                        ephemeral: true,
                    });
                } else if (channel.type !== "GUILD_TEXT") {
                    return await interaction.reply({
                        content: `❌ | The course chat for \`${course}\` is not a text channel.`,
                        ephemeral: true,
                    });
                }

                const permissions = new Permissions(
                    channel.permissionsFor(interaction.user.id).bitfield,
                );

                // Check if the member already has an entry in the channel's permission overwrites, and update
                // the entry if they do just to make sure that they have the correct permissions
                if (
                    permissions.has([
                        Permissions.FLAGS.VIEW_CHANNEL,
                        Permissions.FLAGS.SEND_MESSAGES,
                    ])
                ) {
                    await channel.permissionOverwrites.edit(interaction.member, {
                        VIEW_CHANNEL: true,
                    });
                    return await interaction.reply({
                        content: `❌ | You are already in the course chat for \`${course_with_alias}\`.`,
                        ephemeral: true,
                    });
                }

                // Add the member to the channel's permission overwrites
                await channel.permissionOverwrites.create(interaction.member, {
                    VIEW_CHANNEL: true,
                });

                return await interaction.reply({
                    content: `✅ | Added you to the chat for ${course_with_alias}.`,
                    ephemeral: true,
                });
            } else if (interaction.options.getSubcommand() === COMMAND_LEAVE) {
                const input_course = await interaction.options.getString("course");
                const course = get_real_course_name(input_course);

                if (!is_valid_course(course)) {
                    return await interaction.reply({
                        content: `❌ | You are not allowed to leave this channel using this command.`,
                        ephemeral: true,
                    });
                }

                // First, let's see if there's a role that matches the name of the course
                const role = await interaction.guild.roles.cache.find(
                    (r) => r.name.toLowerCase() === course.toLowerCase(),
                );

                // If there is, let's see if the member already has that role
                if (role !== undefined) {
                    if (!interaction.member.roles.cache.has(role.id)) {
                        return await interaction.reply({
                            content: `❌ | You are not in the course chat for \`${course}\`.`,
                            ephemeral: true,
                        });
                    }

                    // If they do, let's remove the role from them
                    await interaction.member.roles.remove(role);
                    return await interaction.reply({
                        content: `✅ | Removed you from the chat for \`${course}\`.`,
                        ephemeral: true,
                    });
                }

                // Find a channel with the same name as the course
                const channel = await interaction.guild.channels.cache.find(
                    (c) => c.name.toLowerCase() === course.toLowerCase(),
                );

                // Otherwise, make sure that the channel exists, and is a text channel
                if (channel === undefined) {
                    return await interaction.reply({
                        content: `❌ | The course chat for \`${course}\` does not exist.`,
                        ephemeral: true,
                    });
                } else if (channel.type !== "GUILD_TEXT") {
                    return await interaction.reply({
                        content: `❌ | The course chat for \`${course}\` is not a text channel.`,
                        ephemeral: true,
                    });
                }

                const permissions = new Permissions(
                    channel.permissionsFor(interaction.user.id).bitfield,
                );

                // Check if the member already has an entry in the channel's permission overwrites
                if (
                    !permissions.has([
                        Permissions.FLAGS.VIEW_CHANNEL,
                        Permissions.FLAGS.SEND_MESSAGES,
                    ])
                ) {
                    return await interaction.reply({
                        content: `❌ | You are not in the course chat for \`${course}\`.`,
                        ephemeral: true,
                    });
                }

                // Remove the member from the channel's permission overwrites
                await channel.permissionOverwrites.delete(interaction.member);

                return await interaction.reply({
                    content: `✅ | Removed you from the course chat for \`${course}\`.`,
                    ephemeral: true,
                });
            }

            return await interaction.reply("Error: invalid subcommand.");
        } catch (error) {
            await interaction.reply("Error: " + error);
        }
    },
};
