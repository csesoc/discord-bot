const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { apiURL, handbookURL } = require("../config/handbook.json");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("handbook")
        .setDescription("Displays information from the UNSW Handbook.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("courseinfo")
                .setDescription("Displays information about a course.")
                .addStringOption(option => option.setName("coursecode").setDescription("Code of course to display information about (e.g. COMP1511)").setRequired(true))),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "courseinfo") {
            const courseCode = await interaction.options.getString("coursecode").toUpperCase();

            // TODO: Actually get the data lmao
            const courseInfo =
                new MessageEmbed()
                    .setTitle("Test");

            await interaction.reply({ embeds: [courseInfo] });
        }
    },
};

