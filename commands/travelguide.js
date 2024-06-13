const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const { guide } = require("../config/travelguide.json");

// Creates general object and id constants for function use
const prevId = "travelguidePrevButtonId";
const nextId = "travelguideNextButtonId";

const prevButton = new ButtonBuilder()
    .setCustomId(prevId)
    .setLabel("Previous")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("⬅️");

const nextButton = new ButtonBuilder()
    .setCustomId(nextId)
    .setLabel("Next")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("➡️");

const generateLikeButtons = (currentIndex, numEntries) => {
    const buttons = [];
    const endIndex = Math.min(currentIndex + 3, numEntries);

    // Generate a button for each entry on the current page
    for (let i = currentIndex; i < endIndex; i++) {
        const button = new ButtonBuilder()
            .setCustomId(`like_${i}`)
            .setLabel(`Like ${i + 1}`)
            .setStyle(ButtonStyle.Secondary);

        buttons.push(button);
    }

    return buttons;
};

/**
 * Creates an actionRowBuilder with next and previous buttons
 * @param {number} currentIndex
 * @param {number} numEntries
 * @returns
 */
const getComponents = (currentIndex, numEntries) => {
    const buttons = [
        ...(currentIndex > 0 ? [prevButton] : []),
        ...(numEntries - (currentIndex + 3) > 0 ? [nextButton] : []),
        ...generateLikeButtons(currentIndex, numEntries),
    ];

    if (buttons.length === 0) {
        return [];
    }

    return [new ActionRowBuilder().addComponents(buttons)];
};

/**
 * Creates an embed with recommendations starting from an index.
 * @param {number} start The index to start from.
 * @param {number} pages How many pages the embed has.
 * @param {Array<String>} recommendations An array of recommendations.
 * @returns {EmbedBuilder}
 */

const generateGetEmbed = (start, pages, recommendations) => {
    const current = recommendations.slice(start, start + 3);
    const pageNum = Math.floor(start / pages) + 1;

    return new EmbedBuilder({
        title: `Travelguide - Page ${pageNum}`,
        color: 0x3a76f8,
        author: {
            name: "CSESoc Bot",
            icon_url: "https://i.imgur.com/EE3Q40V.png",
        },
        fields: current.map((recommendation, index) => ({
            name: `${start + index + 1}. ${recommendation.location}`,
            value: `**Description**: ${recommendation.description}
                    **Season**: ${recommendation.season}
                    **Likes**: ${recommendation.likes.length}`,
        })),
        footer: {
            text: "CSESoc Bot",
        },
        timestamp: new Date(),
    });
};

/**
 * Creates an embed of the added recommendation
 * @param {object} recommendation The recommendation
 */

const generateAddEmbed = (recommendation, category) => {
    return new EmbedBuilder()
        .setAuthor({
            name: "CSESoc Bot",
            iconURL: "https://i.imgur.com/EE3Q40V.png",
        })
        .setTitle(`${recommendation.location} has been added!`)
        .setDescription(
            `**Description**: ${recommendation.description} 
                **Season**: ${recommendation.season}
                **Category**: ${category}`,
        )
        .setColor(0x3a76f8)
        .setFooter({
            text: "CSESoc Bot",
        })
        .setTimestamp();
};

/**
 * Updates the travelguide.json database
 */
const updateFile = () => {
    fs.writeFileSync("./config/travelguide.json", JSON.stringify({ guide }, null, 4));
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("travelguide")
        .setDescription(
            "Add to and display a travel guide for the recommended restuarants, scenic views and more!",
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription(
                    "Add a recommendation to the travel guide. Then the recommendation will be considered for approval.",
                )
                // [recommendation name] [category] [description] [season optional] [recommender?]
                .addStringOption((option) =>
                    option
                        .setName("recommendation-location")
                        .setDescription("Name of the recommended place.")
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName("category")
                        .setDescription(
                            "The recommended category out of: entertainment, scenic views and restaurants.",
                        )
                        .setRequired(true)
                        .addChoices(
                            { name: "entertainment", value: "entertainment" },
                            { name: "scenic views", value: "scenic views" },
                            { name: "restaurants", value: "restaurants" },
                        ),
                )
                .addStringOption((option) =>
                    option
                        .setName("description")
                        .setDescription(
                            "Brief description of the recommended place in 1-2 sentences.",
                        )
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName("season")
                        .setDescription("The recommended season for the location.")
                        .setRequired(true)
                        .addChoices(
                            { name: "summer", value: "summer" },
                            { name: "autumn", value: "autumn" },
                            { name: "winter", value: "winter" },
                            { name: "spring", value: "spring" },
                            { name: "all year round", value: "all year round" },
                        ),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("get")
                .setDescription("Get a recommendation from the travel guide")
                .addStringOption((option) =>
                    option
                        .setName("category")
                        .setDescription("Sort by the following category")
                        .setRequired(false)
                        .addChoices(
                            { name: "entertainment", value: "entertainment" },
                            { name: "scenic views", value: "scenic views" },
                            { name: "restaurants", value: "restaurants" },
                        ),
                )
                .addStringOption((option) =>
                    option
                        .setName("season")
                        .setDescription("Sort by the following season")
                        .setRequired(false)
                        .addChoices(
                            { name: "summer", value: "summer" },
                            { name: "autumn", value: "autumn" },
                            { name: "winter", value: "winter" },
                            { name: "spring", value: "spring" },
                            { name: "all year round", value: "all year round" },
                        ),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("delete")
                .setDescription("Delete your own recommendation from the travel guide."),
        ),

    async execute(interaction) {
        const authorId = interaction.user.id;

        if (interaction.options.getSubcommand() === "add") {
            const category = interaction.options.getString("category");
            const season = interaction.options.getString("season");
            const location = interaction.options.getString("recommendation-location");
            const description = interaction.options.getString("description");

            const recommendation = {
                location: location,
                description: description,
                season: season ? season : null,
                category: category,
                likes: [],
                authorId: authorId,
                dateAdded: Date.now(),
            };
            const exists = guide.some(
                (item) =>
                    item.location === recommendation.location &&
                    item.description === recommendation.description &&
                    item.season === recommendation.season &&
                    item.category === recommendation.category,
            );

            if (!exists) {
                guide.push(recommendation);
            } else {
                return await interaction.reply({
                    content: "This entry has already been recommended before.",
                });
            }

            updateFile();

            return await interaction.reply({
                embeds: [generateAddEmbed(recommendation, category)],
            });
        } else if (interaction.options.getSubcommand() === "get") {
            const category = interaction.options.getString("category");
            const season = interaction.options.getString("season");
            let recommendations = guide;
            if (category) {
                recommendations = recommendations.filter((entry) => entry.category === category);
            }
            if (season) {
                recommendations = recommendations.filter((entry) => entry.season === season);
            }
            if (recommendations.length === 0) {
                return await interaction.reply({
                    content: `There are currently no recommendations for your selection, add your own recommendation using the **/travelguide add command**`,
                });
            }
            let currentIndex = 0;
            const pages = Math.ceil(recommendations.length / 3);

            await interaction.reply({
                embeds: [generateGetEmbed(currentIndex, pages, recommendations)],
                components: getComponents(currentIndex, recommendations.length),
            });

            // Creates a collector for button interaction events, setting a 120s maximum
            // timeout and a 30s inactivity timeout
            const filter = (resInteraction) => {
                return (
                    (resInteraction.customId === prevId ||
                        resInteraction.customId === nextId ||
                        resInteraction.customId.startsWith("like_")) &&
                    resInteraction.user.id === authorId &&
                    resInteraction.message.interaction.id === interaction.id
                );
            };
            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: 120000,
                idle: 30000,
            });

            collector.on("collect", async (i) => {
                if (i.customId === prevId) {
                    currentIndex -= 3;
                } else if (i.customId === nextId) {
                    currentIndex += 3;
                } else if (i.customId.startsWith("like_")) {
                    const index = parseInt(i.customId.split("_")[1], 10);
                    const userIndex = recommendations[index].likes.indexOf(authorId);
                    if (userIndex === -1) {
                        // If the user hasn't liked it, increment the likes and add their ID to the likes array
                        recommendations[index].likes.push(authorId);
                    } else {
                        // If the user has already liked it, remove their ID from the likes array
                        recommendations[index].likes.splice(userIndex, 1);
                    }
                    updateFile();
                }
                await i.update({
                    embeds: [generateGetEmbed(currentIndex, pages, recommendations)],
                    components: getComponents(currentIndex, recommendations.length),
                });
            });

            // Clears buttons from embed page after timeout on collector
            /*eslint-disable */
            collector.on("end", (collection) => {
                interaction.editReply({ components: [] });
            });
        } else if (interaction.options.getSubcommand() === "delete") {
            const userEntries = [];
            userEntries.push(...guide.filter((entry) => entry.authorId === authorId));
            if (userEntries.length === 0) {
                return await interaction.reply({
                    content: `There are currently no recommendations for your deletion, add recommendations using the **/travelguide add command**`,
                });
            }
            // Generate an embed listing the user's entries
            const userEntriesEmbed = new EmbedBuilder({
                title: `Your recommendations`,
                description: "Below are your recommendations.",
                color: 0x3a76f8,
                author: {
                    name: "CSESoc Bot",
                    icon_url: "https://i.imgur.com/EE3Q40V.png",
                },
                fields: userEntries.map((recommendation, index) => ({
                    name: `${0 + index + 1}. ${recommendation.location}`,
                    value: `**Description**: ${recommendation.description}
                    **Season**: ${recommendation.season}
                    **Likes**: ${recommendation.likes.length}`,
                })),
                footer: {
                    text: "CSESoc Bot",
                },
                timestamp: new Date(),
            });

            // Send the embed
            await interaction.reply({ embeds: [userEntriesEmbed] });

            // Prompt for entry index
            await interaction.channel.send("Please provide the entry number to delete.");

            const collector = interaction.channel.createMessageCollector({
                filter: (message) => message.author.id === authorId,
                max: 1,
                time: 10_000,
            });

            collector.on("collect", async (message) => {
                const entryIndex = parseInt(message.content.trim());
                if (isNaN(entryIndex) || entryIndex < 1 || entryIndex > userEntries.length) {
                    await interaction.followUp("Invalid entry number. No entry was deleted.");
                    return;
                }
                // Confirm entry
                await interaction.channel.send(
                    `Type 'Y' to confirm the deletion of index **${message.content}**`,
                );

                const confirmCollector = interaction.channel.createMessageCollector({
                    filter: (message) => message.author.id === authorId,
                    max: 1,
                    time: 10_000,
                });

                confirmCollector.on("collect", async (message) => {
                    const confirmMessage = message.content.trim();
                    if (confirmMessage === "Y") {
                        // Delete the entry
                        const deletedEntry = userEntries[entryIndex - 1];
                        guide.splice(guide.indexOf(deletedEntry), 1);
                        updateFile();

                        // Notify the user about the deletion
                        await interaction.followUp(
                            `Entry "${deletedEntry.location}" has been deleted.`,
                        );
                    } else {
                        await interaction.followUp(`No entry has been deleted.`);
                    }
                    return;
                });
            });

            collector.on("end", (collected) => {});
        } else {
            return await interaction.reply({
                content: "You do not have permission to execute this command.",
            });
        }
    },
};
