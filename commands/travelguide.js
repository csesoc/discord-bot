const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { v4: uuidv4 } = require("uuid");

// ////////////////////////////////////////////
// //// GENERATE EMBEDS AND ACTION ROW ////////
// ////////////////////////////////////////////

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

/**
 *
 * @param {Number} currentIndex
 * @param {Number} numEntries
 * @returns like buttons for an embed
 */
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
 * Creates an ActionRow with all buttons
 * @param {number} currentIndex
 * @param {number} numEntries
 * @returns {ActionRowBuilder} ActionRow containing all buttons for an embed
 */
const generateActionRow = (currentIndex, numEntries) => {
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
 * @returns {EmbedBuilder} Embed containing 3 recommendations for the travelguide GET command
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
 *
 * @param {String} location
 * @param {String} description
 * @param {String} season
 * @param {String} category
 * @returns an embed containing a summary of the newly added recommendation
 */
const generateAddEmbed = (location, description, season, category) => {
    return new EmbedBuilder()
        .setAuthor({
            name: "CSESoc Bot",
            iconURL: "https://i.imgur.com/EE3Q40V.png",
        })
        .setTitle(`${location} has been added!`)
        .setDescription(
            `**Description**: ${description} 
                **Season**: ${season}
                **Category**: ${category}`,
        )
        .setColor(0x3a76f8)
        .setFooter({
            text: "CSESoc Bot",
        })
        .setTimestamp();
};

// ////////////////////////////////////////////
// //////// SETTING UP THE COMMANDS ///////////
// ////////////////////////////////////////////

const commandTravelguideAdd = new SlashCommandSubcommandBuilder()
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
            .setDescription("Brief description of the recommended place in 1-2 sentences.")
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
    );

const commandTravelguideGet = new SlashCommandSubcommandBuilder()
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
    );

const commandTravelguideDelete = new SlashCommandSubcommandBuilder()
    .setName("delete")
    .setDescription("Delete your own recommendation from the travel guide.");

const baseCommand = new SlashCommandBuilder()
    .setName("travelguide")
    .setDescription(
        "Add to and display a travel guide for the recommended restuarants, scenic views and more!",
    )
    .addSubcommand(commandTravelguideAdd)
    .addSubcommand(commandTravelguideGet)
    .addSubcommand(commandTravelguideDelete);

// ////////////////////////////////////////////
// ///////// HANDLING THE COMMAND /////////////
// ////////////////////////////////////////////

/**
 *
 * @param {CommandInteraction} interaction
 */
async function handleInteraction(interaction) {
    /** @type {DBTravelguide} */
    const travelguideStorage = global.travelguideStorage;
    const authorId = interaction.user.id;

    // figure out which command was called
    const subcommand = interaction.options.getSubcommand(false);
    switch (subcommand) {
        case "add":
            await handleTravelguideAdd(interaction, travelguideStorage, authorId);
            break;
        case "get":
            await handleTravelguideGet(interaction, travelguideStorage, authorId);
            break;
        case "delete":
            await handleTravelguideDelete(interaction, travelguideStorage, authorId);
            break;
        default:
            await interaction.reply("Internal Error AHHHHHHH! CONTACT ME PLEASE!");
    }
}

// ////////////////////////////////////////////
// //////// HANDLING THE SUBCOMMANDS //////////
// ////////////////////////////////////////////

/**
 * Adds a new recommendation to the database and displays a summary of the recommendation
 * @param {CommandInteraction} interaction
 * @param {DBTravelguide} travelguideStorage
 * @param {Number} authorId
 */
async function handleTravelguideAdd(interaction, travelguideStorage, authorId) {
    const location = interaction.options.getString("recommendation-location");
    const description = interaction.options.getString("description");
    const season = interaction.options.getString("season");
    const category = interaction.options.getString("category");

    // check if entry exists in db
    const exists = await travelguideStorage.getRecommendation(location, description, category);
    if (exists.length === 0) {
        travelguideStorage.addRecommendation(
            uuidv4(),
            location,
            description,
            season,
            category,
            authorId,
        );
    } else {
        return await interaction.reply({
            content: "This entry has already been recommended before.",
        });
    }

    return await interaction.reply({
        embeds: [generateAddEmbed(location, description, season, category)],
    });
}

/**
 * Gets 3 recommendations sorted by category/season/neither
 * @param {CommandInteraction} interaction
 * @param {DBTravelguide} travelguideStorage
 * @param {Number} authorId
 */
async function handleTravelguideGet(interaction, travelguideStorage, authorId) {
    const category = interaction.options.getString("category");
    const season = interaction.options.getString("season");
    let recommendations = await travelguideStorage.getRecommendations(category, season);
    if (recommendations.length === 0) {
        return await interaction.reply({
            content: `There are currently no recommendations for your selection, add your own recommendation using the **/travelguide add command**`,
        });
    }
    let currentIndex = 0;
    const pages = Math.ceil(recommendations.length / 3);

    await interaction.reply({
        embeds: [generateGetEmbed(currentIndex, pages, recommendations)],
        components: generateActionRow(currentIndex, recommendations.length),
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
            const recId = recommendations[index].rec_id;

            await travelguideStorage.likeRecommendation(authorId, recId);
            recommendations = await travelguideStorage.getRecommendations(category, season);
        }

        await i.update({
            embeds: [generateGetEmbed(currentIndex, pages, recommendations)],
            components: generateActionRow(currentIndex, recommendations.length),
        });
    });

    // Clears buttons from embed page after timeout on collector
    /*eslint-disable */
    collector.on("end", (collection) => {
        interaction.editReply({ components: [] });
    });
}

/**
 * Deletes a recommendation that the user owns
 * @param {CommandInteraction} interaction
 * @param {DBTravelguide} travelguideStorage
 * @param {Number} authorId
 */
async function handleTravelguideDelete(interaction, travelguideStorage, authorId) {
    const authorEntries = await travelguideStorage.getAuthorRecommendations(authorId);
    if (authorEntries.length === 0) {
        return await interaction.reply({
            content: `There are currently no recommendations for your deletion, add recommendations using the **/travelguide add command**`,
        });
    }
    // Generate an embed listing the user's entries
    const authorEntriesEmbed = new EmbedBuilder({
        title: `Your recommendations`,
        color: 0x3a76f8,
        author: {
            name: "CSESoc Bot",
            icon_url: "https://i.imgur.com/EE3Q40V.png",
        },
        fields: authorEntries.map((recommendation, index) => ({
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
    await interaction.reply({ embeds: [authorEntriesEmbed] });

    // Prompt for entry index
    await interaction.channel.send("Please provide the entry number to delete.");

    const collector = interaction.channel.createMessageCollector({
        filter: (message) => message.author.id === authorId,
        max: 1,
        time: 10_000,
    });

    collector.on("collect", async (message) => {
        const entryIndex = parseInt(message.content.trim());
        if (isNaN(entryIndex) || entryIndex < 1 || entryIndex > authorEntries.length) {
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
                // get the recommendationId
                const recId = authorEntries[entryIndex - 1].rec_id;
                const deletedLocation = authorEntries[entryIndex - 1].location;
                // Delete the entry
                await travelguideStorage.deleteRecommendation(authorId, recId);
                // Notify the user about the deletion
                await interaction.followUp(`Entry "${deletedLocation}" has been deleted.`);
            } else {
                await interaction.followUp(`No entry has been deleted.`);
            }
            return;
        });
    });

    collector.on("end", (collected) => {});
}

module.exports = {
    data: baseCommand,
    execute: handleInteraction,
};
