// @ts-check
import { EmbedBuilder, SlashCommandBuilder, SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { DiscordScroll } from "../lib/discordscroll/scroller";
import { DBFaq } from "../lib/database/faq";

// ////////////////////////////////////////////
// //////// SETTING UP THE COMMANDS ///////////
// ////////////////////////////////////////////

const commandFAQHelp = new SlashCommandSubcommandBuilder()
    .setName("help")
    .setDescription("Get some information about the help command");

const commandFAQGet = new SlashCommandSubcommandBuilder()
    .setName("get")
    .setDescription("Get the information related to a particular keyword")
    .addStringOption((option) =>
        option.setName("keyword").setDescription("Keyword for the question.").setRequired(true),
    );

const commandFAQGetAll = new SlashCommandSubcommandBuilder()
    .setName("getall")
    .setDescription("Get *all* information related to a particular keyword")
    .addStringOption((option) =>
        option.setName("tag").setDescription("Tag to be searched for.").setRequired(true),
    );

const commandFAQGetKeywords = new SlashCommandSubcommandBuilder()
    .setName("keywords")
    .setDescription("Get all keywords that exist for current FAQs");

const commandFAQGetTags = new SlashCommandSubcommandBuilder()
    .setName("tags")
    .setDescription("Get all tags that exist for current FAQs");

// the base command
const baseCommand = new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Master FAQ command")
    .addSubcommand(commandFAQHelp)
    .addSubcommand(commandFAQGet)
    .addSubcommand(commandFAQGetAll)
    .addSubcommand(commandFAQGetKeywords)
    .addSubcommand(commandFAQGetTags);

// ////////////////////////////////////////////
// ///////// HANDLING THE COMMANDS ////////////
// ////////////////////////////////////////////

// handle the command
/** @param {ChatInputCommandInteraction} interaction */
async function handleInteraction(interaction: ChatInputCommandInteraction) {
    /** @type {DBFaq} */
    const faqStorage: DBFaq = (global as any).faqStorage;

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
            await handleFAQHelp(interaction);
            break;
        case "keywords":
            await handleFAQKeywords(interaction, faqStorage);
            break;
        case "tags":
            await handleFAQTags(interaction, faqStorage);
            break;
        default:
            await interaction.reply("Internal Error AHHHHHHH! CONTACT ME PLEASE!");
    }
}

// ////////////////////////////////////////////
// ///////// HANDLING THE COMMANDS ////////////
// ////////////////////////////////////////////

/**
 * @param {ChatInputCommandInteraction} interaction
 * @param {DBFaq} faqStorage
 */
async function handleFAQGet(interaction: ChatInputCommandInteraction, faqStorage: DBFaq) {
    const get_keyword = interaction.options.get("keyword");
    if (!get_keyword) return;

    // get the keyword
    const keyword = String(get_keyword.value).toLowerCase();

    // get db entry
    const rows = await faqStorage.get_faq(keyword);
    if (!rows) return;

    if (rows.length > 0) {
        const answer = rows[0]["answer"];
        await interaction.reply(`FAQ: ${keyword}\n${answer}`);
    } else {
        await interaction.reply({
            content: "A FAQ for this keyword does not exist!",
            ephemeral: true,
        });
    }
}

/**
 * @param {ChatInputCommandInteraction} interaction
 * @param {DBFaq} faqStorage
 */
async function handleFAQGetAll(interaction: ChatInputCommandInteraction, faqStorage: DBFaq) {
    // @TODO: create "tags" system to support fectching multiple FAQs
    // get the keyword
    const get_tag = interaction.options.get("tag");
    if (!get_tag) return;

    const tag = String(get_tag.value).toLowerCase();

    // get db entry
    const rows = await faqStorage.get_tagged_faqs(tag);
    if (!rows) return;

    if (rows.length > 0) {
        const answers: EmbedBuilder[] = [];
        for (const row of rows) {
            const newPage = new EmbedBuilder({
                title: `FAQS for the tag: ${tag}`,
                color: 0xf1c40f,
                timestamp: new Date().getTime(),
            }).addFields([
                {
                    name: row.keyword,
                    value: row.answer,
                    inline: true,
                },
            ]);
            answers.push(newPage);
        }
        const scroller = new DiscordScroll(answers);
        await scroller.send(interaction);
    } else {
        await interaction.reply({
            content: "A FAQ for this keyword does not exist!",
            ephemeral: true,
        });
    }
}

/**
 * @param {ChatInputCommandInteraction} interaction
 */
async function handleFAQHelp(interaction: ChatInputCommandInteraction) {
    // @TODO: expand this function
    let description = "Welcome to the help command! You can search for a specific faq";
    description += " by keyword using 'faq get [keyword]', or for everything on a given ";
    description += "topic by using 'faq getall [tag]'. ";
    description += "Use 'faq keywords' to get a list of all keywords, or ";
    description += "use 'faq tags' to get a list of all tags.";

    await interaction.reply(description);
}

/**
 * @param {ChatInputCommandInteraction} interaction
 * @param {DBFaq} faqStorage
 */
async function handleFAQKeywords(interaction: ChatInputCommandInteraction, faqStorage: DBFaq) {
    // get db entry
    const keywords = await faqStorage.get_keywords();
    if (keywords) {
        await interaction.reply(`Current list of keyword is:\n${keywords}`);
    } else {
        await interaction.reply({
            content: "No keywords currently in database!",
            ephemeral: true,
        });
    }
}

/**
 * @param {ChatInputCommandInteraction} interaction
 * @param {DBFaq} faqStorage
 */
async function handleFAQTags(interaction: ChatInputCommandInteraction, faqStorage: DBFaq) {
    // get db entry
    const tags = await faqStorage.get_tags();
    if (tags) {
        await interaction.reply(`Current list of tags is:\n${tags}`);
    } else {
        await interaction.reply({
            content: "No tags currently in database!",
            ephemeral: true,
        });
    }
}

module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};