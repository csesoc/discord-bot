const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");

const is_valid_course_name = (course) => {
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

const in_overwrites = (overwrites, id) => overwrites.some((v, k) => k === id);

async function editChannels(interaction, channels) {
    for (const channel in channels) {
        const is_valid = is_valid_course_name(channel.name);

        if (!is_valid || channel.type !== "GUILD_TEXT") continue;

        let role = await interaction.guild.roles.cache.find(
            (r) => r.name.toLowerCase() === channel.name.toLowerCase(),
        );

        if (!role) {
            role = interaction.guild.roles.create({
                name: channel.name.toLowerCase(),
                color: "BLUE",
            });
        }

        // clear every individual user permission overwrite for the channel
        for (const user of channel.members) {
            const userId = user[0];
            const permissions = channel.permissionOverwrites.cache;

            // Check if the member has access via individual perms
            if (in_overwrites(permissions, userId)) {
                // Remove the member from the channel's permission overwrites
                channel.permissionOverwrites.delete(interaction.guild.members.cache.get(userId));
            }
            user[1].roles.add(role);
        }

        // set the permissions for the new role on a channel
        // const channel = interaction.guild.channels.cache.get('CHANNEL_ID');
        channel.permissionOverwrites.create(role, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
        });
    }
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

            // Get all channels and run function
            interaction.guild.channels
                .fetch()
                .then(async (channels) => editChannels(interaction, channels))
                .catch(console.error);
        } catch (error) {
            await interaction.reply("Error: " + error);
        }
    },
};
