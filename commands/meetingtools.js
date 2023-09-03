// @ts-check
const { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } = require("discord.js");

// Tools to help manage meetings

module.exports = {
    data: new SlashCommandBuilder()
        .setName("meeting")
        .setDescription("Tools to help manage meetings in voice channels")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("queue")
                .setDescription("Generates a queue of vc participants")
                .addStringOption((option) =>
                    option
                        .setName("exclude")
                        .setDescription("Exclude certain vc participants, enter as @user1 @user2"),
                )
                .addStringOption((option) =>
                    option
                        .setName("include")
                        .setDescription("Include users that are not in vc, enter as @user1 @user2"),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("random")
                .setDescription("Picks a random vc participants")
                .addStringOption((option) =>
                    option
                        .setName("exclude")
                        .setDescription("Exclude certain vc participants, enter as @user1 @user2"),
                )
                .addStringOption((option) =>
                    option
                        .setName("include")
                        .setDescription("Include users that are not in vc, enter as @user1 @user2"),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("groups")
                .setDescription("Puts vc participants into groups")
                .addIntegerOption((option) =>
                    option
                        .setName("num_groups")
                        .setDescription("Number of groups")
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName("exclude")
                        .setDescription("Exclude certain vc participants, enter as @user1 @user2"),
                )
                .addStringOption((option) =>
                    option
                        .setName("include")
                        .setDescription("Include users that are not in vc, enter as @user1 @user2"),
                ),
        ),

    /**
     * @async
     * @param {ChatInputCommandInteraction} interaction
     * @returns 
     */
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return;
        const { member } = interaction;
        const voice_channel = member.voice.channel;

        // Check if connected to voice channel
        if (!voice_channel) {
            return await interaction.reply({
                content: "You are currently not connected to a voice channel",
                ephemeral: true,
            });
        }

        /** @type {string[]} */
        const participants = [];

        // Gets all participants of the voice channel
        voice_channel.members.each((member) => {
            participants.push(member.user.tag);
        });

        const include = interaction.options.getString("include");
        const exclude = interaction.options.getString("exclude");

        // Include extra users from command input
        if (include) {
            include
                .trim()
                .split(/\s+/)
                .forEach((user) => {
                    const user_id = user.substr(3, 18);
                    const m = interaction.member.guild.members.cache.get(user_id);
                    if (m) {
                        participants.push(m.user.tag);
                    }
                });
        }

        // Exclude particular users from command input
        if (exclude) {
            exclude
                .trim()
                .split(/\s+/)
                .forEach((user) => {
                    const user_id = user.substr(3, 18);
                    const member = interaction.member.guild.members.cache.get(user_id);
                    if (member) {
                        const index = participants.indexOf(member.user.tag);
                        if (index !== -1) {
                            participants.splice(index, 1);
                        }
                    }
                });
        }

        const command = interaction.options.getSubcommand();
        let ret_val = "";

        if (command === "queue") {
            // Create a random queue of users
            shuffleArray(participants);

            let counter = 1;

            participants.forEach((participant) => {
                ret_val += `${counter}. ${participant}\n`;
                counter++;
            });
        } else if (command === "random") {
            // Selects user at random
            ret_val = participants[Math.floor(Math.random() * participants.length)];
        } else if (command === "groups") {
            // Groups users into a given number of groups
            shuffleArray(participants);

            const num_groups = interaction.options.getInteger("num_groups", true);
            const members_per_group = Math.round(participants.length / num_groups);

            let group_num = 1;
            let member_num = 0;

            participants.forEach((participant) => {
                if (member_num == 0) {
                    ret_val += `Group ${group_num}\n`;
                }

                ret_val += participant + "\n";
                member_num++;

                if (group_num < num_groups && member_num == members_per_group) {
                    member_num = 0;
                    group_num++;
                    ret_val += "\n";
                }
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(command)
            .setColor(0x0099ff)
            .setDescription(ret_val);

        return await interaction.reply({
            embeds: [embed],
        });
    },
};

// shuffleArray function from
// https://www.geeksforgeeks.org/how-to-shuffle-an-array-using-javascript/
/**
 * 
 * @param {any[]} array 
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        // Generate random number
        const j = Math.floor(Math.random() * (i + 1));

        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    return array;
}
