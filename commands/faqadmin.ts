// @ts-check
import { PermissionFlagsBits, SlashCommandBuilder, SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { DBFaq } from "../lib/database/faq";

// ////////////////////////////////////////////
// //////// SETTING UP THE COMMANDS ///////////
// ////////////////////////////////////////////

// faq admin delete
const commandFAQADelete = new SlashCommandSubcommandBuilder()
    .setName("delete")
    .setDescription("[ADMIN] Delete a FAQ entry.")
    .addStringOption((option) =>
        option.setName("keyword").setDescription("The identifying word.").setRequired(true),
    );

// faq admin create
const commandFAQACreate = new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("[ADMIN] Create a FAQ entry.")
    .addStringOption((option) =>
        option.setName("keyword").setDescription("The identifying word.").setRequired(true),
    )
    .addStringOption((option) =>
        option.setName("answer").setDescription("The answer to the question.").setRequired(true),
    )
    .addStringOption((option) =>
        option.setName("tags").setDescription("The answer to the question.").setRequired(false),
    );

// the base command
const baseCommand = new SlashCommandBuilder()
    .setName("faqadmin")
    .setDescription("[ADMIN] Master FAQ admin command")
    .addSubcommand(commandFAQACreate)
    .addSubcommand(commandFAQADelete);

// ////////////////////////////////////////////
// ///////// HANDLING THE COMMANDS ////////////
// ////////////////////////////////////////////

// handle the command
/** @param {ChatInputCommandInteraction} interaction */
async function handleInteraction(interaction: ChatInputCommandInteraction) {
    /** @type {DBFaq} */
    const faqStorage: DBFaq = (global as any).faqStorage;

    if (!interaction.inCachedGuild()) return; 

    // Admin permission check (this may not work uhm)
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({
            content: "You do not have permission to execute this command.",
            ephemeral: true,
        });
        return;
    }

    // figure out which command was called
    const subcommand = interaction.options.getSubcommand(false);
    /** @type {string | null} */
    let keyword: string | null = null;
    
    /** @type {string | null} */
    let answer: string | null = null;

    /** @type {string | null} */
    let tags: string | null = null;

    /** @type {boolean | undefined} */
    let success: boolean | null = false;

    /** @type {import("discord.js").CommandInteractionOption<"cached"> | null} */
    let get_keyword: import("discord.js").CommandInteractionOption<"cached"> | null = null;
    
    switch (subcommand) {
        case "create":
            get_keyword = interaction.options.get("keyword");
            const get_answer = interaction.options.get("answer");
            if (get_keyword == null || get_answer == null) return;

            keyword = String(get_keyword.value).toLowerCase();
            answer = String(get_answer.value);
            if (answer.length >= 1024) {
                await interaction.reply({
                    content: "The answer must be < 1024 characters...",
                    ephemeral: true,
                });
            }

            console.log("gets here");
            const get_tags = interaction.options.get("tags");
            if (get_tags != null) {
                tags = String(get_tags.value);
                // validate "tags" string
                if (tags) {
                    tags = tags.trim();
                    const tagRegex = /^([a-zA-Z]+,)*[a-zA-Z]+$/;
                    if (!tagRegex.test(tags)) {
                        await interaction.reply({
                            content: "ERROR: tags must be comma-separated alphabetic strings",
                            ephemeral: true,
                        });
                        break;
                    }
                }
            }

            success = await faqStorage.new_faq(keyword, answer, tags!);
            if (success) {
                await interaction.reply({
                    content: `Successfully created FAQ entry for '${keyword}': ${answer}`,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: "Something went wrong, make sure you are using a unique keyword!",
                    ephemeral: true,
                });
            }
            break;
        case "delete":
            get_keyword = interaction.options.get("keyword");
            if (get_keyword == null) return;

            keyword = String(get_keyword.value).toLowerCase();
            success = await faqStorage.del_faq(keyword);
            if (success) {
                await interaction.reply({
                    content: `Successfully Deleted FAQ entry for '${keyword}'.`,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: "Something went wrong, make sure you are giving a unique keyword!",
                    ephemeral: true,
                });
            }
            break;
        default:
            await interaction.reply("Internal Error OH NO! CONTACT ME PLEASE!");
    }
}

module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};