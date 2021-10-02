//@ts-check
const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, ContextMenuInteraction, Client } = require("discord.js");

const { CarrotboardStorage } = require("../lib/carrotboard");

/** @type {CarrotboardStorage} */
const cbStorage = global.cbStorage;

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
    .setName("channel")
    .setDescription("Sets the current channel to be the output channel.");

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
    const commandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();
    if (commandGroup == "admin") {
        switch (subcommand) {
            case "carrot":
                await handleCBACarrot(interaction);
                break;
            case "channel":
                await handleCBAChannel(interaction);
                break;
            default:
                await interaction.reply("error");
        }
    } else {
        switch (subcommand) {
            case "main":
                await handleCBMain(interaction);
                break;
            case "user":
                await handleCBUser(interaction);
                break;
            case "emoji":
                await handleCBAll(interaction);
                break;
            case "id":
                await handleCBID(interaction);
                break;
            default:
                await interaction.reply("error2");
        }
    }
}

/** @param {CommandInteraction} interaction */
async function handleCBACarrot(interaction) {
    await interaction.reply("admin carrot");
    // do stuff
}

/** @param {CommandInteraction} interaction */
async function handleCBAChannel(interaction) {
    await interaction.reply("admin channel");
    // do stuff
}

/** @param {CommandInteraction} interaction */
async function handleCBMain(interaction) {
    await interaction.reply("main");
    // do stuff
}

/** @param {CommandInteraction} interaction */
async function handleCBUser(interaction) {
    await interaction.reply("user");
    // do stuff
}

/** @param {CommandInteraction} interaction */
async function handleCBAll(interaction) {
    await interaction.reply("emoji");
    // do stuff
}

/** @param {CommandInteraction} interaction */
async function handleCBID(interaction) {
    await interaction.reply("id");
    // do stuff
}


module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};

