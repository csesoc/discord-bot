// @ts-check
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ButtonInteraction, SlashCommandBuilder, ComponentType } from "discord.js";

// Fetches commands from the help data
import { commands } from "../config/help.json";

// Creates general object and id constants for function use
const prevId = "helpPrevButtonId";
const nextId = "helpNextButtonId";

const prevButton = new ButtonBuilder({
    style: ButtonStyle.Secondary,
    label: "Previous",
    emoji: "⬅️",
    customId: prevId,
});

const nextButton = new ButtonBuilder({
    style: ButtonStyle.Secondary,
    label: "Next",
    emoji: "➡️",
    customId: nextId,
});

const PAGE_SIZE = 10;

/**
 * Creates an embed with commands starting from an index.
 * @param {number} start The index to start from.
 * @returns {EmbedBuilder}
 */
const generateEmbed = (start: number): EmbedBuilder => {
    const current = commands.slice(start, start + PAGE_SIZE);
    const pageNum = Math.floor(start / PAGE_SIZE) + 1;

    return new EmbedBuilder({
        title: `Help Command - Page ${pageNum}`,
        color: 0x3a76f8,
        author: {
            name: "CSESoc Bot",
            icon_url: "https://i.imgur.com/EE3Q40V.png",
        },
        fields: current.map((command, index) => ({
            name: `${start + index + 1}. ${command.name}`,
            value: `${command.description}\nUsage: ${command.usage}`,
        })),
    });
};

module.exports = {
    // Add new /help command
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription(
            "Displays info for all commands. Also type / in the chat to check out other commands.",
        )
        .addNumberOption((option) =>
            option.setName("page")
                .setDescription("Requested Help Page")
                .setRequired(false)
        ),

    /**
     *
     * @async
     * @param {ChatInputCommandInteraction} interaction
     * @returns
     */
    async execute(interaction: ChatInputCommandInteraction) {
        // Calculates required command page index if inputted
        const page = interaction.options.getNumber("page");
        let currentIndex = 0;

        if (page) {
            if (page < 1 || page > Math.ceil(commands.length / PAGE_SIZE)) {
                const ephemeralError = {
                    content: "Your requested page does not exist, please try again.",
                    ephemeral: true,
                };

                await interaction.reply(ephemeralError);
                return;
            } else {
                const adjustedIndex = (page - 1) * PAGE_SIZE;
                if (adjustedIndex < commands.length) {
                    currentIndex = adjustedIndex;
                }
            }
        }

        // Generates help menu with given or default index and posts embed
        const helpEmbed = generateEmbed(currentIndex);
        const authorId = interaction.user.id;

        /** @type {ActionRowBuilder<ButtonBuilder>} */
        const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder();
        if (currentIndex) {
            row.addComponents(prevButton);
        }
        if (currentIndex + PAGE_SIZE < commands.length) {
            row.addComponents(nextButton);
        }
        await interaction.reply({ embeds: [helpEmbed], components: [row] });

        // Creates a collector for button interaction events, setting a 120s maximum
        // timeout and a 30s inactivity timeout

        /**
         * @param {ButtonInteraction} resInteraction
         * @returns {boolean}
         */

        const filter = (resInteraction: ButtonInteraction): boolean => {
            return (
                (resInteraction.customId === prevId || resInteraction.customId === nextId) &&
                resInteraction.user.id === authorId
            );
        };

        if (!interaction.channel) return;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 120000,
            idle: 30000,
        });

        collector.on("collect", async (i) => {
            // Adjusts the currentIndex based on the id of the button pressed
            i.customId === prevId ? (currentIndex -= PAGE_SIZE) : (currentIndex += PAGE_SIZE);
            
            /** @type {ActionRowBuilder<ButtonBuilder>} */
            const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder();
            if (currentIndex) {
                row.addComponents(prevButton);
            }
            if (currentIndex + PAGE_SIZE < commands.length) {
                row.addComponents(nextButton);
            }

            await i.update({ embeds: [generateEmbed(currentIndex)], components: [row] });
        });

        // Clears buttons from embed page after timeout on collector
        /*eslint-disable */
        collector.on("end", (_) => {
            interaction.editReply({ components: [] });
        });
    },
};