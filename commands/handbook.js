const axios = require("axios");
const textVersion = require("textversionjs");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { apiURL, handbookURL } = require("../config/handbook.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("handbook")
        .setDescription("Displays information from the UNSW Handbook.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("courseinfo")
                .setDescription("Displays information about a course.")
                .addStringOption((option) =>
                    option
                        .setName("coursecode")
                        .setDescription(
                            "Code of course to display information about (e.g. COMP1511)",
                        )
                        .setRequired(true),
                ),
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "courseinfo") {
            const courseCode = await interaction.options.getString("coursecode").toUpperCase();

            let data;
            try {
                // Documented at:
                // https://circlesapi.csesoc.app/docs#/courses/get_course_courses_getCourse__courseCode__get
                const response = await axios.get(`${apiURL}/courses/getCourse/${courseCode}`);
                data = response.data;
            } catch (e) {
                return await interaction.reply({
                    content: "Invalid course code.",
                    ephemeral: true,
                });
            }

            const {
                title, code, uoc, level, description, study_level, school,
                faculty, equivalents, exclusions, terms, raw_requirements
            } = data;

            const courseInfo = new MessageEmbed()
                .setTitle(title)
                .setURL(`${handbookURL}/${code}`)
                .setColor(0x3a76f8)
                .setAuthor(
                    `Course Info: ${code} (${uoc} UOC)`,
                    "https://i.imgur.com/EE3Q40V.png",
                )
                .addFields(
                    {
                        name: "Overview",
                        value: textVersion(description).substring(
                            0,
                            Math.min(textVersion(description).indexOf("\n"), 1024),
                        ),
                        inline: false,
                    },
                    {
                        name: "Enrolment Requirements",
                        value:
                            raw_requirements.replace(
                                /[A-Z]{4}[0-9]{4}/g,
                                `[$&](${handbookURL}$&)`,
                            ) || "None",
                        inline: true,
                    },
                    {
                        name: "Offering Terms",
                        value: terms.join(", "),
                        inline: true,
                    },
                    {
                        name: "Equivalent Courses",
                        value:
                        equivalents
                                .map((course) => `[${course}](${handbookURL}${course})`)
                                .join(", ") || "None",
                        inline: true,
                    },
                    {
                        name: "Exclusion Courses",
                        value:
                            exclusions
                                .map((course) => `[${course}](${handbookURL}${course})`)
                                .join(", ") || "None",
                        inline: true,
                    },
                    /* { */
                    /*     name: "Course Outline", */
                    /*     value: `[${courseCode} Course Outline](${data["course_outline_url"]})`, */
                    /*     inline: true, */
                    /* }, */
                )
                .setTimestamp()
                .setFooter("Data fetched from Circles' Api");

            await interaction.reply({ embeds: [courseInfo] });
        }
    },
};
