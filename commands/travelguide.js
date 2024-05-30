const travelguide = require("../config/travelguide.json");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require("fs");
const { guide } = require("../config/travelguide.json");

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
                        .setName("recommendation_location")
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
                .setName("get")
                .setDescription("Get a recommendation from the travel guide")
                .addStringOption((option) =>
                    option
                        .setName("category")
                        .setDescription("Sort by the following category")
                        .setRequired(true)
                        .addChoices(
                            { name: "entertainment", value: "entertainment" },
                            { name: "scenic views", value: "scenic views" },
                            { name: "restaurants", value: "restaurants" },
                        ),
                ),
        ),

    async execute(interaction) {
        if (interaction.options.getSubcommand() === "add") {
            let category = interaction.options.getString("category");
            let season = interaction.options.getString("season");
            let location = interaction.options.getString("recommendation_location");
            let description = interaction.options.getString("description");

            let recommendation = {
                location: location,
                description: description,
                season: season ? season : null,
            };

            if (guide.hasOwnProperty(category)) {
                let exists = guide[category].some(
                    (item) =>
                        item.location === recommendation.location &&
                        item.description === recommendation.description &&
                        item.season === recommendation.season,
                );

                if (!exists) {
                    guide[category].push(recommendation);
                    console.log(`Added recommendation to ${category}`);
                } else {
                    return await interaction.reply({
                        content: "This entry has already been recommended before.",
                        ephemeral: true,
                    });
                }
            }
            fs.writeFileSync("./config/travelguide.json", JSON.stringify({ guide }, null, 4));

            let returnString = `The recommendation at location: ${location}, with description: ${description}, `;
            returnString = season
                ? returnString +
                  `during season: ${season}, has been added to the ${category} database.`
                : returnString + `has been added to the ${category} database.`;
            return await interaction.reply({
                content: returnString,
                ephemeral: true,
            });
        } else if (interaction.options.getSubcommand() === "get") {
            let category = interaction.options.getString("category");
            console.log(guide[category]);
            // if (guide[category])
            return await interaction.reply({
                content: guide[category],
                ephemeral: true,
            });
        } else {
            return await interaction.reply({
                content: "You do not have permission to execute this command.",
                ephemeral: true,
            });
        }
    },
};
