const help = require("../config/help.json");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

// Fetches commands from the help data
const commands = help.commands;

// Creates general object and id constants for function use
const prevId = "helpPrevButtonId";
const nextId = "helpNextButtonId";

const prevButton = new ButtonBuilder({
    style: "SECONDARY",
    label: "Previous",
    emoji: "⬅️",
    customId: prevId,
});
const nextButton = new ButtonBuilder({
    style: "SECONDARY",
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
const generateEmbed = (start) => {
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
            option.setName("page").setDescription("Requested Help Page").setRequired(false),
        ),
    async execute(interaction) {
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

        await interaction.reply({
            embeds: [helpEmbed],
            components: [
                new ActionRowBuilder({
                    components: [
                        // previous button if it isn't the start
                        ...(currentIndex ? [prevButton] : []),
                        // next button if it isn't the end
                        ...(currentIndex + PAGE_SIZE < commands.length ? [nextButton] : []),
                    ],
                }),
            ],
        });

        // Creates a collector for button interaction events, setting a 120s maximum
        // timeout and a 30s inactivity timeout
        const filter = (resInteraction) => {
            return (
                (resInteraction.customId === prevId || resInteraction.customId === nextId) &&
                resInteraction.user.id === authorId
            );
        };
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 120000,
            idle: 30000,
        });

        collector.on("collect", async (i) => {
            // Adjusts the currentIndex based on the id of the button pressed
            i.customId === prevId ? (currentIndex -= PAGE_SIZE) : (currentIndex += PAGE_SIZE);

            await i.update({
                embeds: [generateEmbed(currentIndex)],
                components: [
                    new ActionRowBuilder({
                        components: [
                            // previous button if it isn't the start
                            ...(currentIndex ? [prevButton] : []),
                            // next button if it isn't the end
                            ...(currentIndex + PAGE_SIZE < commands.length ? [nextButton] : []),
                        ],
                    }),
                ],
            });
        });

        // Clears buttons from embed page after timeout on collector
        /*eslint-disable */
        collector.on("end", (collection) => {
            interaction.editReply({ components: [] });
        });
    },
};
