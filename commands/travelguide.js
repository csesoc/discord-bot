const travelguide = require("../config/travelguide.json");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

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
                        .setName("recommendation location")
                        .setDescription("Name of the recommended place.")
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName("category")
                        .setDescription(
                            "The recommended category out of: entertainment, scenic views and restuarants.",
                        )
                        .setRequired(true)
                        .addChoices(
                            { name: 'entertainment', value: 'entertainment' },
                            { name: 'scenic views', value: 'scenic views' },
                            { name: 'restuarants', value: 'restuarants' },
                        ));
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
                        .setRequired(false),
                ),

        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "add") {
            let jsonObj = JSON.parse(travelguide);
            let recommendation = {
                "name": interaction.options.getString("recommendation location"),
                "description": interaction.options.getString("description"),
                "season": "",
            }
            let category = interaction.options.getString("category");
            jsonObj.category.push(recommendation);
            jsonObj = JSON.stringify(jsonObj);
        }
    }
};
