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

const in_overwrites = (overwrites, id) =>
    [1024n, 3072n].includes(overwrites.find((v, k) => k === id)?.allow?.bitfield);

async function editChannels(interaction, channels) {
    for (const data of channels) {
        const channel = data[1];

        if (!channel) continue;

        const is_valid = is_valid_course_name(channel.name);

        if (!is_valid || channel.type !== "GUILD_TEXT") continue;

        let role = interaction.guild.roles.cache.find(
            (r) => r.name.toLowerCase() === channel.name.toLowerCase(),
        );

        if (!role) {
            role = await interaction.guild.roles.create({
                name: channel.name.toLowerCase(),
                color: "BLUE",
            });
        }

        const permissions = channel.permissionOverwrites.cache;

        // clear every individual user permission overwrite for the channel
        for (const user of channel.members) {
            const userId = user[0];
            const userObj = user[1];

            if (userObj.user.bot) continue;

            // Check if the member has access via individual perms
            if (in_overwrites(permissions, userId)) {
                // Remove the member from the channel's permission overwrites
                await channel.permissionOverwrites.delete(userObj);
                await userObj.roles.add(role);
            }
        }

        // set the permissions for the new role on a channel
        // const channel = interaction.guild.channels.cache.get('CHANNEL_ID');
        await channel.permissionOverwrites.create(role, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
        });
    }
}

async function isFixed(interaction, channel) {
    const is_valid = is_valid_course_name(channel.name);

    if (!is_valid || channel.type !== "GUILD_TEXT") return true;

    const role = interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === channel.name.toLowerCase(),
    );

    if (!role) return false;

    const permissions = channel.permissionOverwrites.cache;

    // clear every individual user permission overwrite for the channel
    for (const user of channel.members) {
        const userId = user[0];
        const userObj = user[1];

        if (userObj.user.bot) continue;

        // Check if the member has access via individual perms
        if (in_overwrites(permissions, userId)) return false;
    }

    if (!in_overwrites(permissions, role.id)) return false;

    return true;
}

async function allFixed(interaction, channels) {
    const unfixed = [];
    for (const data of channels) {
        const channel = data[1];

        if (!channel) continue;

        const fixed = await isFixed(interaction, channel);

        if (!fixed) unfixed.push(channel.name);
    }

    return unfixed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rolespermoverride")
        .setDescription(
            "Looks for matches between roles and course chats and attaches permissions.",
        )
        .addBooleanOption((option) =>
            option
                .setName("singlechannel")
                .setDescription(
                    "Should this command only be run on the current channel? (Default: False)",
                )
                .setRequired(false),
        )
        .addBooleanOption((option) =>
            option
                .setName("check")
                .setDescription(
                    "Should a check be run on if the channel is fixed? (Default: False)",
                )
                .setRequired(false),
        ),
    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                return await interaction.reply({
                    content: "You do not have permission to execute this command.",
                    ephemeral: true,
                });
            }

            await interaction.deferReply();

            // for all roles with name == chat name involving 4 letter prefix comp, seng, engg or binf,

            if (!interaction.options.getBoolean("singlechannel")) {
                // Get all channels and run specified function
                const channels = interaction.guild.channels.cache;

                if (!interaction.options.getBoolean("check")) {
                    await editChannels(interaction, channels);
                    await interaction.editReply(
                        "Successfully ported all user permissions to roles.",
                    );
                } else {
                    const unfixed = await allFixed(interaction, channels);

                    if (unfixed.length === 0) {
                        await interaction.editReply("All channels in this server appear fixed.");
                    } else {
                        await interaction.editReply(
                            `The following channels appear unfixed: ${unfixed.join(", ")}`,
                        );
                    }
                }
            } else {
                const channel = interaction.channel;

                if (!interaction.options.getBoolean("check")) {
                    await editChannels(interaction, [[undefined, channel]]);
                    await interaction.editReply(
                        "Successfully ported user permissions to roles in this channel",
                    );
                } else {
                    const fixed = await isFixed(interaction, channel);

                    if (fixed) {
                        await interaction.editReply("This channel appears fixed.");
                    } else {
                        await interaction.editReply("This channel appears unfixed.");
                    }
                }
            }
        } catch (error) {
            await interaction.editReply("Error: " + error);
        }
    },
};
