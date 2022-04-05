//@ts-check
const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { CommandInteraction } = require("discord.js");
const { DBFaq } = require("../lib/database/faq");

//////////////////////////////////////////////
////////// SETTING UP THE COMMANDS ///////////
//////////////////////////////////////////////

const commandFAQHelp = new SlashCommandSubcommandBuilder()
    .setName("help")
    .setDescription("Get some information about the help command");

const commandFAQGet = new SlashCommandSubcommandBuilder()
    .setName("get")
    .setDescription("Get the information related to a particular keyword")
    .addStringOption(option => option.setName("keyword").setDescription("Keyword for the question.").setRequired(true));

const commandFAQGetAll = new SlashCommandSubcommandBuilder()
    .setName("getall")
    .setDescription("Get *all* information related to a particular keyword")
    .addStringOption(option => option.setName("keyword").setDescription("Keyword for the question.").setRequired(true));

// the base command
const baseCommand = new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Master FAQ command")
    .addSubcommand(commandFAQHelp)
    .addSubcommand(commandFAQGet)
    .addSubcommand(commandFAQGetAll);
    

//////////////////////////////////////////////
/////////// HANDLING THE COMMANDS ////////////
//////////////////////////////////////////////

// handle the command
/** @param {CommandInteraction} interaction */
async function handleInteraction(interaction) {
    /** @type {DBFaq} */
    const faqStorage = global.faqStorage;

    // figure out which command was called
    const subcommand = interaction.options.getSubcommand(false);
    switch (subcommand) {
        case "get":
            await handleFAQGet(interaction, faqStorage);
            break;
        case "getall":
            await handleFAQGetAll(interaction, faqStorage);
            break;
        case "help":
            await handleFAQHelp(interaction, faqStorage);
            break;
        default:
            await interaction.reply("Internal Error AHHHHHHH! CONTACT ME PLEASE!");
    }
}


//////////////////////////////////////////////
/////////// HANDLING THE COMMANDS ////////////
//////////////////////////////////////////////

/** 
 * @param {CommandInteraction} interaction
 * @param {DBFaq} faqStorage
 */
async function handleFAQGet(interaction, faqStorage) {
    // get the keyword
    const keyword = String(interaction.options.get("keyword").value).toLowerCase();
    
    // get db entry
    const rows = await faqStorage.get_faq(keyword);
    if (rows.length > 0) {
        const answer = rows[0]["answer"];
        await interaction.reply(`FAQ: ${keyword}\n${answer}`);
    } else {
        await interaction.reply({ content: "A FAQ for this keyword does not exist!", ephemeral: true });
    }
}

/** 
 * @param {CommandInteraction} interaction
 * @param {DBFaq} faqStorage
 */
 async function handleFAQGetAll(interaction, faqStorage) {
     // @TODO: create "tags" system to support fectching multiple FAQs
    // get the keyword
    const keyword = String(interaction.options.get("keyword").value).toLowerCase();
    
    // get db entry
    const rows = await faqStorage.get_faq(keyword);
    if (rows.length > 0) {
        for (let row of rows) {
            const answer = row["answer"];
            await interaction.reply(`FAQ: ${keyword}\n${answer}`);
        }
    } else {
        await interaction.reply({ content: "A FAQ for this keyword does not exist!", ephemeral: true });
    }
}

/** 
 * @param {CommandInteraction} interaction
 * @param {DBFaq} faqStorage
 */
 async function handleFAQHelp(interaction, faqStorage) {
    // @TODO: expand this function 
    let description = "Welcome to the help command! You can search for a specific faq"
    description += "q by keyword using 'faq get keyword', or for everything on a given ";
    description += "topic by using faq getall keyword";

    await interaction.reply(description);
}

module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};

