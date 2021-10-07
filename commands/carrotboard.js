//@ts-check
const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, ContextMenuInteraction, Client, MessageEmbed } = require("discord.js");

const { CarrotboardStorage, extractOneEmoji } = require("../lib/carrotboard");
const { DiscordScroll } = require("../lib/discordscroll/scroller");

//////////////////////////////////////////////
////////// SETTING UP THE COMMANDS ///////////
//////////////////////////////////////////////

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

// the base command
const baseCommand = new SlashCommandBuilder()
    .setName("cb")
    .setDescription("Master carrotboard command")
    .addSubcommand(commandCBMain)
    .addSubcommand(commandCBUser)
    .addSubcommand(commandCBAll)
    .addSubcommand(commandCBID)

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
            await interaction.reply("Internal Error AHHHHHHH! CONTACT ME PLEASE!");
    }
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBMain(interaction, cbStorage) {
    // generate leaderboard and send it
    const pages = await cbStorage.generateLeaderboard({emoji: String(cbStorage.config.carrot)});
    
    const scroller = new DiscordScroll(pages);
    await scroller.send(interaction);
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBUser(interaction, cbStorage) {
    // get the user in question
    let user = interaction.options.getUser("username");
    if (user == null) {
        user = interaction.user;
    }
    const userID = user.id;

    // get data
    const pages = await cbStorage.generateLeaderboard({userID: String(userID)});
    const scroller = new DiscordScroll(pages);
    await scroller.send(interaction);
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBAll(interaction, cbStorage) {
    // check if emoji given
    const messageStr = interaction.options.getString("emoji", false);
    if (messageStr == null) {
        // no emoji given
        const pages = await cbStorage.generateLeaderboard({});
        const scroller = new DiscordScroll(pages);
        await scroller.send(interaction);
        return;
    }

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

    // all good
    const pages = await cbStorage.generateLeaderboard({emoji: result.emoji});
    const scroller = new DiscordScroll(pages);
    await scroller.send(interaction);
}

/** 
 * @param {CommandInteraction} interaction
 * @param {CarrotboardStorage} cbStorage
 */
async function handleCBID(interaction, cbStorage) {
    // is required so known not null
    const id = interaction.options.getInteger("cbid", true);
    
    // get the entry
    const entry = await cbStorage.db.get_by_cb_id(id);
    if (entry == null) {
        await interaction.reply({ content: "Please include a valid carrotboard ID!", ephemeral: true });
        return;
    }

    // get the details
    const guildID = cbStorage.config.guildID;
    const channelID = entry["channel_id"];
    const messageID = entry["message_id"];
    const url = `https://discord.com/channels/${guildID}/${channelID}/${messageID}`;
    let content = entry["message_contents"].trimEnd();
    if (content.length >= this.maxMsgLen) {
        content = content.slice(0, this.maxMsgLen) + "...";
    } else if (content.length) {
        
    }

    // create the embed
    const embed = new MessageEmbed({
        title: `Carrotboard ${id}`,
        description: content,
        color: Math.floor(Math.random() * 16581374),
        url: url,
    });

    // send the embed
    await interaction.reply({ embeds: [embed] });
}


module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};

