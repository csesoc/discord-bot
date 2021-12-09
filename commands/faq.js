//@ts-check
const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction } = require("discord.js");
const { DBFaq } = require("../lib/database/faq");

//////////////////////////////////////////////
////////// SETTING UP THE COMMANDS ///////////
//////////////////////////////////////////////

// the base command
const baseCommand = new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Master FAQ command")
    .addStringOption(option => option.setName("keyword").setDescription("Keyword for the question.").setRequired(true));

//////////////////////////////////////////////
/////////// HANDLING THE COMMANDS ////////////
//////////////////////////////////////////////

// handle the command
/** @param {CommandInteraction} interaction */
async function handleInteraction(interaction) {
    /** @type {DBFaq} */
    const faqStorage = global.faqStorage;

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

module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};

