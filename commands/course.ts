// @ts-check
import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

const MODERATION_REQUEST_CHANNEL = BigInt("824506830641561600");
const COMMAND_JOIN = "join";
const COMMAND_LEAVE = "leave";

// map of course aliases to their actual names
const course_aliases: Record<string, string> = {
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

/**
 * 
 * @param {string} course 
 * @returns {string}
 */
const get_real_course_name = (course: string): string => {
    course = course.toLowerCase();
    if (course_aliases[course]) {
        const alias = course_aliases[course];
        return alias!;
    }
    return course;
};

/**
 * 
 * @param {string} course 
 * @returns {boolean}
 */
const is_valid_course = (course: string): boolean => {
    const reg_comp_course = /^comp\d{4}$/;
    const reg_math_course = /^math\d{4}$/;
    const reg_binf_course = /^binf\d{4}$/;
    const reg_engg_course = /^engg\d{4}$/;
    const reg_seng_course = /^seng\d{4}$/;
    const reg_desn_course = /^desn\d{4}$/;

    course = course.toLowerCase();
    return (
        reg_comp_course.test(course) ||
        reg_math_course.test(course) ||
        reg_binf_course.test(course) ||
        reg_engg_course.test(course) ||
        reg_seng_course.test(course) ||
        reg_desn_course.test(course)
    );
};

const in_overwrites = (overwrites, id) =>
    [1024n, 3072n].includes(overwrites.find((v, k) => k === id)?.allow?.bitfield);

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

    /**
     *
     * @async
     * @param {ChatInputCommandInteraction} interaction
     * @returns
     */
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild()) return Promise.resolve();

        try {
            if (interaction.options.getSubcommand() === COMMAND_JOIN) {
                const input_course = interaction.options.getString("course", true).toLowerCase();
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
                const role = interaction.guild.roles.cache.find(
                    r => r.name.toLowerCase() === course.toLowerCase()
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
                const channel = interaction.guild.channels.cache.find(
                    c => c.name.toLowerCase() === course.toLowerCase()
                );

                // Make sure that the channel exists, and is a text channel
                if (channel === undefined) {
                    return await interaction.reply({
                        content: `❌ | The course chat for \`${course}\` does not exist. If you'd like for it to be created, please raise a ticket in <#${MODERATION_REQUEST_CHANNEL}>.`,
                        ephemeral: true,
                    });
                } else if (channel.type !== ChannelType.GuildText) {
                    return await interaction.reply({
                        content: `❌ | The course chat for \`${course}\` is not a text channel.`,
                        ephemeral: true,
                    });
                }
                
                // channel has type GuildBasedChannel
                const permissionsFor = channel.permissionsFor(interaction.user.id);
                if (!permissionsFor) return;
                const permissions = new PermissionsBitField(permissionsFor.bitfield);

                // Check if the member already has an entry in the channel's permission overwrites, and update
                // the entry if they do just to make sure that they have the correct permissions
                if (
                    permissions.has([
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                    ])
                ) {
                    await channel.permissionOverwrites.edit(interaction.member, { ViewChannel: true });
                    return await interaction.reply({
                        content: `❌ | You are already in the course chat for \`${course_with_alias}\`.`,
                        ephemeral: true,
                    });
                }

                // Add the member to the channel's permission overwrites
                await channel.permissionOverwrites.create(interaction.member, { ViewChannel: true });

                return await interaction.reply({
                    content: `There doesn't exist a role for \`${course_with_alias}\`. If you believe there should be, please inform a member of the Discord Bot team or staff.`,
                    ephemeral: true,
                });
            } else if (interaction.options.getSubcommand() === COMMAND_LEAVE) {
                const input_course = interaction.options.getString("course", true);
                const course = get_real_course_name(input_course);

                if (!is_valid_course(course)) {
                    return await interaction.reply({
                        content: `❌ | Not a valid course.`,
                        ephemeral: true,
                    });
                }

                // First, let's see if there's a role that matches the name of the course
                const role = interaction.guild.roles.cache.find(
                    r => r.name.toLowerCase() === course.toLowerCase(),
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
                const channel = interaction.guild.channels.cache.find(
                    c => c.name.toLowerCase() === course.toLowerCase(),
                );

                if (channel === undefined) {
                    return await interaction.reply({
                        content: `❌ | The course chat for \`${course}\` does not exist.`,
                        ephemeral: true,
                    });
                } else if (channel.type !== ChannelType.GuildText) {
                    return await interaction.reply({
                        content: `❌ | The course chat for \`${course}\` is not a text channel.`,
                        ephemeral: true,
                    });
                }

                const permissionsFor = channel.permissionsFor(interaction.user.id);
                if (!permissionsFor) return;
                const permissions = new PermissionsBitField(permissionsFor.bitfield);

                // Check if the member already has an entry in the channel's permission overwrites
                if (
                    !permissions.has([
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages
                    ])
                ) {
                    return await interaction.reply({
                        content: `✅ | Removed you from the chat for \`${course}\`.`,
                        ephemeral: true,
                    });
                } else {
                    return await interaction.reply({
                        content: `❌ | You do not have access to the chat for \`${course}\`.`,
                        ephemeral: true,
                    });
                }
            }
            return await interaction.reply("Error: invalid subcommand.");
        } catch (error) {
            await interaction.reply("Error: " + error);
        }
    },
};