const {
    EmbedBuilder,
    SlashCommandBuilder,
    InteractionResponse,
    ChatInputCommandInteraction
} = require("discord.js");

/**
 * @typedef {Object} voteData
 * @property {string} string
 * @property {string} authorid
 * @property {string} channelid
 * @property {string} messageid
 */

/**
 * @type {voteData[]}
 */
let data = require("../config/votes.json").data;
const fs = require("fs");

/**
 * @async
 * @param {ChatInputCommandInteraction} interaction
 * @returns
 */
const vote_vote = async (interaction) => {
    // Getting the required string and data from the input
    const voteauthorid = interaction.user.id;
    const voteauthorname = interaction.user.username;
    const channelid = interaction.channelId;

    let votestring = interaction.options.getString("votestring");
    // Generating the vote string
    votestring = votestring + ", vote by " + voteauthorname;

    // Generating the embed
    const embed = new EmbedBuilder().setTitle(votestring);
    const message = await interaction.reply({
        embeds: [embed],
        fetchReply: true,
    });
    // Adding the default reacts
    message.react("👍");
    message.react("👎");

    const messageid = message.id;

    // Writing to the data file
    data.unshift({
        string: votestring,
        authorid: voteauthorid,
        channelid: channelid,
        messageid: messageid,
    });
    fs.writeFileSync("./config/votes.json", JSON.stringify({ data: data }, null, 4));
}

/**
 * @async
 * @param {ChatInputCommandInteraction} interaction
 * @returns
 */
const vote_voteresult = async (interaction) => {
    // Get the last messageid of the vote done on this channel
    const channelid = interaction.channelId;

    // Finding the required vote
    const found = data.find((element) => element.channelid == channelid);

    if (found == undefined) {
        const embed = new EmbedBuilder().setTitle("0 votes found on this channel");
        await interaction.reply({ embeds: [embed], fetchReply: true });
        return;
    } else {
        const channelID = found.channelid;
        const messageID = found.messageid;

        const msghandler = interaction.channel.messages;
        const msg = await msghandler.fetch(found.messageid);

        const cacheChannel = msg.guild.channels.cache.get(channelID);

        if (cacheChannel) {
            cacheChannel.messages.fetch(messageID).then((reactionMessage) => {
                /**
                 * @type {[{name: string, value: string}]}
                */
                const responses = [];
                reactionMessage.reactions.cache.forEach((value, key) => {
                    if (key == "👍" || key == "👎") {
                        responses.push({
                            name: String(key),
                            value: String(value.count - 1),
                        });
                    } else {
                        responses.push({
                            name: String(key),
                            value: String(value.count),
                        });
                    }
                });
                const embed = new EmbedBuilder()
                    .setTitle(found.string)
                    .addFields(responses);

                (async () => {
                    await interaction.reply({ embeds: [embed] });
                })();
            });
        } else {
            // If an error occurs, Delete everything on the file
            await interaction.reply("An error occurred");
            data = [];
            fs.writeFileSync(
                "./config/votes.json",
                JSON.stringify({ data: data }, null, 4),
            );
        }
    }
}

/**
 * @async
 * @param {ChatInputCommandInteraction} interaction
 * @returns
 */

const vote_voteresultfull = async (interaction) => {
    // Returns the list of all users who voted
    // Get the last messageid of the vote done on this channel
    const channelid = interaction.channelId;

    const found = data.find((element) => element.channelid == channelid);

    if (found == undefined) {
        const embed = new EmbedBuilder().setTitle("0 votes found on this channel");
        await interaction.reply({ embeds: [embed], fetchReply: true });
        return;
    } else {
        const channelID = found.channelid;
        const messageID = found.messageid;

        const msghandler = interaction.channel.messages;
        const msg = await msghandler.fetch(found.messageid);

        const cacheChannel = msg.guild.channels.cache.get(channelID);

        if (cacheChannel) {
            cacheChannel.messages.fetch(messageID).then((reactionMessage) => {
                const responses = [];
                reactionMessage.reactions.cache.forEach((value, key) => {
                    const temp = {};
                    temp["name"] = String(key);
                    temp["value"] = "";
                    value.users.cache.forEach((value_) => {
                        if (value_.bot == false) {
                            temp["value"] = temp["value"] + "\n" + String(value_.username);
                        }
                    });
                    if (temp["value"] == "") {
                        temp["value"] = "None";
                    }
                    responses.push(temp);
                });
                const embed = new EmbedBuilder()
                    .setTitle(found.string)
                    .addFields(responses);

                (async () => {
                    await interaction.reply({ embeds: [embed] });
                })();
            });
        } else {
            await interaction.reply("An error occurred");
            data = [];
            fs.writeFileSync(
                "./config/votes.json",
                JSON.stringify({ data: data }, null, 4),
            );
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("voting")
        .setDescription("Manage votes")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("vote")
                .setDescription("Starts a vote")
                .addStringOption((option) =>
                    option
                        .setName("votestring")
                        .setDescription("Message you want to vote")
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("voteresult")
                .setDescription("Result of the last vote done on the channel"),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("voteresultfull")
                .setDescription(
                    "Full result of the last vote done on the channel (includes the discord names)",
                ),
        ),

    /**
     * @async
     * @param {ChatInputCommandInteraction} interaction
     * @returns
     */
    async execute(interaction) {
        // Starting a vote
        if (interaction.options.getSubcommand() === "vote") {
            await vote_vote(interaction);
        } else if (interaction.options.getSubcommand() === "voteresult") {
            await vote_voteresult(interaction);
            // await interaction.reply("Done");
        } else if (interaction.options.getSubcommand() === "voteresultfull") {
            await vote_voteresultfull(interaction);
            // await interaction.reply("Done");
        }
    },
};
