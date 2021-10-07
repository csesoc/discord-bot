//@ts-check
const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, ContextMenuInteraction, Client, MessageEmbed } = require("discord.js");

const { CarrotboardStorage, extractOneEmoji } = require("../lib/carrotboard");
const { DiscordScroll } = require("../lib/discordscroll/scroller");

//////////////////////////////////////////////
////////// SETTING UP THE COMMANDS ///////////
//////////////////////////////////////////////

// cb admin carrot :emoji:
const commandCBACarrot = new SlashCommandSubcommandBuilder()
    .setName("carrot")
    .setDescription("Sets the given emoji as the carrot.")
    .addStringOption(option => option.setName("emoji").setDescription("The emoji.").setRequired(true));

// cb admin channel
const commandCBAChannel = new SlashCommandSubcommandBuilder()
    .setName("output")
    .setDescription("Sets the current channel to be the output channel of type.")
    .addStringOption(option => option.setName("type").setDescription("The type of output channel").addChoice("leaderboard", "leaderboard").addChoice("alert", "alert").setRequired(true));

// the base command
const baseCommand = new SlashCommandBuilder()
    .setName("cbadmin")
    .setDescription("Master carrotboard admin command")
    .setDefaultPermission(false)
    .addSubcommand(commandCBACarrot)
    .addSubcommand(commandCBAChannel);

//////////////////////////////////////////////
/////////// HANDLING THE COMMANDS ////////////
//////////////////////////////////////////////

// handle the command
/** @param {CommandInteraction} interaction */
async function handleInteraction(interaction) {
    /** @type {CarrotboardStorage} */
    const cbStorage = global.cbStorage;

    // figure out which command was called
    const subcommand = interaction.options.getSubcommand(false);
    switch (subcommand) {
        case "carrot":
            await handleCBACarrot(interaction, cbStorage);
            break;
        case "output":
            await handleCBAOutput(interaction, cbStorage);
            break;
        default:
            await interaction.reply("Internal Error OH NO! CONTACT ME PLEASE!");
    }
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBACarrot(interaction, cbStorage) {
    // known something given
    const messageStr = interaction.options.getString("emoji");

    // emoji was given get the emoji
    const result = extractOneEmoji(messageStr);
    if (result == null) {
        // none were given
        await interaction.reply({ content: "Please give one emoji.", ephemeral: true });
        return;
    } else if (result.index != 0) {
        // not at the front
        await interaction.reply({ content: "Please give only an emoji.", ephemeral: true });
        return;
    }

    // successful
    cbStorage.config.carrot = result.emoji;
    cbStorage.config.saveToFile();
    await interaction.reply({ content: `Carrot emoji set to ${result.emoji}`, ephemeral: true });
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBAOutput(interaction, cbStorage) {
    // get details
    const channelID = interaction.channelId;
    const choice = interaction.options.getString("type");

    // perform the choice
    if (choice == "alert") {
        // update the config
        try {
            cbStorage.config.alertChannelID = channelID;
            cbStorage.config.saveToFile();

            await interaction.reply({content: "Alert Output Channel Set.", ephemeral: true});
        } catch (e) {
            console.error(e);
            await interaction.reply({content: "Error occurred, please check logs.", ephemeral: true});
        }
    } else {
        // update the config
        try {
            // send the messages and update the config
            const leaderboard = await cbStorage.generateLeaderboard({ onlyFirstPage: true, emoji: cbStorage.config.carrot });
            const message = await interaction.channel.send({embeds: [leaderboard[0]]});

            cbStorage.config.permaChannelID = channelID;
            cbStorage.config.leaderboardID = message.id;
            cbStorage.config.saveToFile();
            
            await interaction.reply({content: "Leaderboard Channel Set.", ephemeral: true});
        } catch (e) {
            // an error occurred
            console.error(e);
            await interaction.reply({content: "Error occurred, please check logs.", ephemeral: true});
        }
    } 
}

module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};

