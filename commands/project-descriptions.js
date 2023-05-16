const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
//const axios = require("axios").default;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("project-descriptions")
        .setDescription("Returns a description for each project under CSESoc Development!")
        .addStringOption((option) =>
            option.setName("project")
            .setDescription("Which project do you want to be introduced to?")
            .setRequired(true)
            .addChoices(
				[["Chaos", "chaos"], 
                ["Circles", "circles"],
                ["CS Electives", "cselectives"],
                ["Discord Bot", "discordbot"],
                ["Freerooms", "freerooms"],
                ["Jobsboard", "jobsboard"],
                ["Notangles", "notangles"],
                ["Structs.sh", "structs.sh"],
                ["UI/UX", "ui/ux"],
                ["Website", "website"]],
			)
        ),

    async execute(interaction) {
        // Calculates required command page index if inputted
        const page = interaction.options.get("project");
        let parsedOption = (`${interaction.options.get("project").value}`).toLowerCase();
        console.log(`.${parsedOption}.`);
        switch (parsedOption) {
            case "chaos":
                await interaction.reply("Chaos is a CSESoc internal recruitment tool written in Rust.");
                break;
            case "circles":
                await interaction.reply("Circles is a degree planner that helps you choose courses, plan out your terms and check progression.");
                break;
            case "cselectives":
                await interaction.reply("Unsure about what a course is like? Worry no more; CSElectives lets you read and write reviews of UNSW CSE courses.");
                break;
            case "discordbot":
                await interaction.reply("CSESoc Discord Bot is your friendly helper in all things fun and CSE.");
                break;
            case "freerooms":
                await interaction.reply("Looking for a room to study in? Freerooms lets you see which on-campus rooms are vacant and which ones are booked.");
                break;
            case "jobsboard":
                await interaction.reply("Jobsboard is an app that connects CSE students with companies looking for recruits.");
                break;
            case "notangles":
                await interaction.reply("Notangles is a timetable planning app for UNSW students to build their perfect timetable, even before class registration opens.");
                break;
            case "structs.sh":
                await interaction.reply("Structs.sh is an interactive algorithm visualiser.");
                break;
            case "ui/ux":
                await interaction.reply("The CSESoc Development UI/UX team works with all things related to user interface and experience design!");
                break;
            case "website":
                await interaction.reply("The website team are in charge of writing the software for the CSESoc website.");
                break;
            default:
                await interaction.reply("Error: the switch case has fallen through to the default case.");
                break;
        }
        

    },
};
