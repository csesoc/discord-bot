const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");

const COMMAND_KICKUNVERIFIED = "kickunverified";
const COMMAND_MIGRATE = "migratecourses";
const COMMAND_REMOVECOURSEROLES = "nukeremovecourseroles";

// yeah i know this code is copy pasted from the other file
// but whatever, the migration command is temporary!
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
        .setName("admin")
        .setDescription("Admin-only commands.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName(COMMAND_KICKUNVERIFIED)
                .setDescription("Kicks all unverified users from the server."),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName(COMMAND_MIGRATE)
                .setDescription("Migrates course roles to permission overwrites."),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName(COMMAND_REMOVECOURSEROLES)
                .setDescription("WARNING: Removes a course role from the server.")
                .addStringOption((option) =>
                    option
                        .setName("course")
                        .setDescription("Course role to remove")
                        .setRequired(true),
                )
        ),
    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                return await interaction.reply({
                    content: "You do not have permission to execute this command.",
                    ephemeral: true,
                });
            }

            if (interaction.options.getSubcommand() === COMMAND_KICKUNVERIFIED) {
                const role = await interaction.guild.roles.cache.find(
                    (r) => r.name.toLowerCase() === "unverified",
                );

                // Make sure that the "unverified" role exists
                if (role === undefined) {
                    return await interaction.reply('Error: no "unverified" role exists.');
                }

                const kickMessage =
                    "You have been removed from the CSESoc Server as you have not verified via the instructions in #welcome.\
                    If you wish to rejoin, visit https://cseso.cc/discord";

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
            } else if (interaction.options.getSubcommand() === COMMAND_MIGRATE) {
                const course = interaction.options.getString("course");
                if (!is_valid_course(course)) {
                    return await interaction.reply("Error: invalid course.");
                }

                const role = await interaction.guild.roles.cache.find(
                    (course_role) => role.name.toLowerCase() === course.toLowerCase(),
                    );
                    
                    
                if (role === undefined) {
                    return await interaction.reply("Error: no role exists for course " + course);
                }
                
                
                const channel = await interaction.guild.channels.cache.find(
                    (role_channel) =>
                    role_channel.name.toLowerCase() === role.name.toLowerCase(),
                    );
                    
                if (channel === undefined) {
                    return await interaction.reply("Error: no channel exists for course " + course);
                }
                            
                await interaction.deferReply();
                for (const member of role.members.values()) {
                    await channel.permissionOverwrites.create(member, {
                        VIEW_CHANNEL: true,
                    });
                }
                return await interaction.editReply("Migrated course role to permission overwrites.");
            } else if (interaction.options.getSubcommand() === COMMAND_REMOVECOURSEROLES) {
                // get all roles, and find courses which match the regex
                const course_roles = await interaction.guild.roles.cache.filter((role) =>
                    is_valid_course(role.name),
                );

                await interaction.deferReply();

                for (const role of course_roles.values()) {
                    await role.delete();
                }

                return await interaction.editReply("Removed all course roles.");
            }

            return await interaction.reply("Error: unknown subcommand.");
        } catch (error) {
            await interaction.reply("Error: " + error);
        }
    },
};
