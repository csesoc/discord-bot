const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");

const MODERATION_REQUEST_CHANNEL = 824506830641561600;
const COMMAND_JOIN = "join";
const COMMAND_LEAVE = "leave";

const replyError = async (interaction, message) => {
    return await interaction.reply({
        content: `❌ | ${message}`,
        ephemeral: true,
    });
}

const replySuccess = async (interaction, message) => {
    return await interaction.reply({
        content: `✅ | ${message}`,
        ephemeral: true,
    });
}

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

/**
 * @param {string} course
 * @returns {string}
 */
const get_real_course_name = (course) => course_aliases[course.toLowerCase()] ?? course;
/**
 * @param {string} course
 * @returns {string}
 */
const cleanup_course_name = (course) => course.toLowerCase().trim();

const courseRegex = /^([a-zA-Z]{4}\d{4})$/;
/**
 * @param {string} course
 * @returns {boolean}
 */
const is_course = (course) => courseRegex.test(course);

/**
 * @param {string} course
 * @returns {boolean}
 */
function is_valid_course(course) {
    const course_code = cleanup_course_name(course);
    const reg_comp_course = /^comp\d{4}$/;
    const reg_math_course = /^math\d{4}$/;
    const reg_binf_course = /^binf\d{4}$/;
    const reg_engg_course = /^engg\d{4}$/;
    const reg_seng_course = /^seng\d{4}$/;
    const reg_desn_course = /^desn\d{4}$/;

    return (
        reg_comp_course.test(course_code) ||
        reg_math_course.test(course_code) ||
        reg_binf_course.test(course_code) ||
        reg_engg_course.test(course_code) ||
        reg_seng_course.test(course_code) ||
        reg_desn_course.test(course_code)
    );
};

async function handleCourseJoin(interaction) {
    const input_course = await interaction.options.getString("course").toLowerCase();
    const course = get_real_course_name(cleanup_course_name(input_course));

    const is_valid = is_valid_course(course);

    const course_with_alias =
        course != input_course
            ? `${course} (same course chat as ${input_course})`
            : `${course}`;

    if (!is_valid) {
        return is_course(course)
            ? await replyError("Course chats for other faculties are not supported.")
            : await replyError("This this not a valid course code.");
    }

    // First, let's see if there's a role that matches the name of the course
    const role = await interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === course.toLowerCase(),
    );

    // If there is, let's see if the member already has that role
    if (role === undefined) {
        return await replyError(interaction, `There is no course chat for \`${course_with_alias}\``);
    }

    if (interaction.member.roles.cache.has(role.id)) {
        return await replyError(`You are already in the course chat for \`${course_with_alias}\`.`);
    }

    // If they don't, let's add the role to them
    await interaction.member.roles.add(role);
    return await replySuccess(interaction, `Added you to the chat for \`${course_with_alias}\`.`);
}

async function handleCourseLeave(interaction) {
    const input_course = await interaction.options.getString("course");
    const course = get_real_course_name(input_course);

    if (!is_valid) {
        return is_course(course)
            ? replyError("Course chats for other faculties are not supported.")
            : replyError("This this not a valid course code.");
    }

    // First, let's see if there's a role that matches the name of the course
    const role = await interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === course.toLowerCase(),
    );
    if (role === undefined) {
        return await replyError(interaction, `There is no course chat for \`${course_with_alias}\``);
    }

    // If there is, let's see if the member already has that role
    if (!interaction.member.roles.cache.has(role.id)) {
        return await replyError(interaction, `You are not in the course chat for \`${course}\`.`);
    }

    // If they do, let's remove the role from them
    await interaction.member.roles.remove(role);
    return await replyError(interaction, `Removed you from the chat for \`${course}\`.`);
}


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
                return await handleCourseJoin(interaction);
            } else if (interaction.options.getSubcommand() === COMMAND_LEAVE) {
                return await handleCourseLeave(interaction);
            }

            return await interaction.reply("Error: invalid subcommand.");
        } catch (error) {
            await interaction.reply("Error: " + error);
        }
    },
};
