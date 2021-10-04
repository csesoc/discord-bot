const axios = require("axios");
const textVersion = require("textversionjs");
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

            let data;
            try {
                const response = await axios.get(`${apiURL}${courseCode}`);
                data = response.data;
            } catch (e) {
                return await interaction.reply({ content: "Invalid course code.", ephemeral: true });
            }

            const courseInfo =
                new MessageEmbed()
                    .setTitle(data["title"])
                    .setURL(`${handbookURL}${courseCode}`)
                    .setColor(0x3A76F8)
                    .setAuthor(`Course Info: ${courseCode} (${data["credit_points"]} UOC)`, "https://i.imgur.com/EE3Q40V.png")
                    .addFields(
                        {
                            name: "Overview",
                            value: textVersion(data["description"])
                                .substring(0, Math.min(textVersion(data["description"]).indexOf("\n"), 1024)),
                            inline: false,
                        },
                        {
                            name: "Enrolment Requirements",
                            value: data["enrolment_requirements"]
                                .replace(/[A-Z]{4}[0-9]{4}/g, `[$&](${handbookURL}$&)`)
                                || "None",
                            inline: true,
                        },
                        {
                            name: "Offering Terms",
                            value: data["offering_terms"],
                            inline: true,
                        },
                        {
                            name: "Delivery Mode",
                            value: data["delivery_mode"],
                            inline: true,
                        },
                        {
                            name: "Equivalent Courses",
                            value: data["equivalent_courses"]
                                .map(course => `[${course}](${handbookURL}${course})`)
                                .join(", ")
                                || "None",
                            inline: true,
                        },
                        {
                            name: "Exclusion Courses",
                            value: data["exclusion_courses"]
                                .map(course => `[${course}](${handbookURL}${course})`)
                                .join(", ")
                                || "None",
                            inline: true,
                        },
                        {
                            name: "Course Outline",
                            value: `[${courseCode} Course Outline](${data["course_outline_url"]})`,
                            inline: true,
                        },
                    )
                    .setTimestamp()
                    .setFooter("Data fetched from Zac's Handbook API");

            await interaction.reply({ embeds: [courseInfo] });
        }
    },
};

