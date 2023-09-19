const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");

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

function editChannels(interaction, channels, role) {
    channels.forEach((channel) => {
        if (
            channel.type === "GUILD_TEXT" &&
            channel.name.toLowerCase() === role.name.toLowerCase()
        ) {
            // Remove all permissions from a role
            role.setPermissions(0n)
                .then((updated) =>
                    console.log(`Updated permissions to ${updated.permissions.bitfield}`),
                )
                .catch(console.error);
            // Set the permissions of the role
            // Add the member to the channel's permission overwrites
            channel.permissionOverwrites.create(role, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
            });
            console.log(channel.name, role.name);
        }
    });
}

function editRoles(interaction, roles) {
    roles.forEach((role) => {
        if (is_valid_course(role.name)) {
            interaction.guild.channels
                .fetch()
                .then(
                    (channels) => (
                        editChannels(interaction, channels, role),
                        console.log(`There are ${channels.size} channels.`)
                    ),
                )
                .catch(console.error);
        }
    });
    interaction.reply({
        content: `✅ | found course chats and matching roles, cleared and set permission overwrites for roles.`,
        ephemeral: true,
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rolespermoverride")
        .setDescription(
            "Looks for matches between roles and course chats and attaches permissions.",
        ),
    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                return await interaction.reply({
                    content: "You do not have permission to execute this command.",
                    ephemeral: true,
                });
            }
            // for all roles with name == chat name involving 4 letter prefix comp, seng, engg or binf,

            // give the role the permission override to participate in the matching channel.
            interaction.guild.roles
                .fetch()
                .then(
                    (roles) => (
                        editRoles(interaction, roles), console.log(`There are ${roles.size} roles.`)
                    ),
                )
                .catch(console.error);
        } catch (error) {
            await interaction.reply("Error: " + error);
        }
    },
};
