//@ts-check
const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, ContextMenuInteraction, Client } = require("discord.js");

const { CarrotboardStorage } = require("../lib/carrotboard");

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

// cb main
const commandCBMain = new SlashCommandSubcommandBuilder()
    .setName("main")
    .setDescription("The main carrotboard.");

// cb user [@username]
const commandCBUser = new SlashCommandSubcommandBuilder()
    .setName("user")
    .setDescription("Gets the CB for a certain User.")
    .addUserOption(option => option.setName("username").setDescription("The @ of the user if wanted.").setRequired(false));

// cb emoji [:emoji:]
const commandCBAll = new SlashCommandSubcommandBuilder()
    .setName("emoji")
    .setDescription("Gets an/all emoji board.")
    .addStringOption(option => option.setName("emoji").setDescription("The specific emoji board if wanted.").setRequired(false));

// cb id <id>
const commandCBID = new SlashCommandSubcommandBuilder()
    .setName("id")
    .setDescription("Get a specific carrotted message.")
    .addIntegerOption(option => option.setName("cbid").setDescription("The specific id.").setRequired(true));

// setting up groups
const adminCommands = new SlashCommandSubcommandGroupBuilder()
    .setName("admin")
    .setDescription("cb Admin commands")
    .addSubcommand(commandCBACarrot)
    .addSubcommand(commandCBAChannel);

// the base command
const baseCommand = new SlashCommandBuilder()
    .setName("cb")
    .setDescription("Master carrotboard command")
    .addSubcommand(commandCBMain)
    .addSubcommand(commandCBUser)
    .addSubcommand(commandCBAll)
    .addSubcommand(commandCBID)
    .addSubcommandGroup(adminCommands);

//////////////////////////////////////////////
/////////// HANDLING THE COMMANDS ////////////
//////////////////////////////////////////////

// handle the command
/** @param {CommandInteraction} interaction */
async function handleInteraction(interaction) {
    /** @type {CarrotboardStorage} */
    const cbStorage = global.cbStorage;

    const commandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();
    if (commandGroup == "admin") {
        switch (subcommand) {
            case "carrot":
                await handleCBACarrot(interaction, cbStorage);
                break;
            case "output":
                await handleCBAOutput(interaction, cbStorage);
                break;
            default:
                await interaction.reply("error");
        }
    } else {
        switch (subcommand) {
            case "main":
                await handleCBMain(interaction, cbStorage);
                break;
            case "user":
                await handleCBUser(interaction, cbStorage);
                break;
            case "emoji":
                await handleCBAll(interaction, cbStorage);
                break;
            case "id":
                await handleCBID(interaction, cbStorage);
                break;
            default:
                await interaction.reply("error2");
        }
    }
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBACarrot(interaction, cbStorage) {
    await interaction.reply("admin carrot");
    // do stuff
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBAOutput(interaction, cbStorage) {
    // console.log("Setting Channel");
    // console.log(interaction);

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
            cbStorage.config.permaChannelID = channelID;
            const leaderboard = await cbStorage.generateLeaderboard({ onlyFirstPage: true, emoji: cbStorage.config.carrot });
            const message = await interaction.channel.send({embeds: [leaderboard[0]]});
            cbStorage.config.leaderboardID = message.id;
            cbStorage.config.saveToFile();
            await interaction.reply({content: "Leaderboard Channel Set.", ephemeral: true});
        } catch (e) {
            console.error(e);
            await interaction.reply({content: "Error occurred, please check logs.", ephemeral: true});
        }
    } 
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBMain(interaction, cbStorage) {
    await interaction.reply("main");
    // do stuff
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBUser(interaction, cbStorage) {
    await interaction.reply("user");
    // do stuff
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBAll(interaction, cbStorage) {
    await interaction.reply("emoji");
    // do stuff
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBID(interaction, cbStorage) {
    await interaction.reply("id");
    // do stuff
}


module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};

