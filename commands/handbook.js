const axios = require("axios");
const textVersion = require("textversionjs");
const { EmbedBuilder, SlashCommandBuilder, CommandInteraction, BaseInteraction, ChatInputCommandInteraction } = require("discord.js");
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

    /**
     * @async
     * @param {ChatInputCommandInteraction} interaction
     * @returns 
     */
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "courseinfo") {
            const courseCode = interaction.options.getString("coursecode").toUpperCase();

            /** 
             * @typedef {Object} CourseData
             * @property {string} title
             * @property {string} code
             * @property {number} UOC
             * @property {number} level
             * @property {string} description
             * @property {string} study_level
             * @property {string} handbook_note
             * @property {string} school
             * @property {string} faculty
             * @property {string} campus
             * @property {Record<string, number>} equivalents
             * @property {Record<string, number>} exclusions
             * @property {string[]} terms
             * @property {string} raw_requirements
             * @property {boolean} gen_ed
             *  
             */

            /** @type {CourseData} */
            let data = {};
            try {
                // Documented at:
                // https://circlesapi.csesoc.app/docs#/courses/get_course_courses_getCourse__courseCode__get
                const response = await axios.get(`${apiURL}/courses/getCourse/${courseCode}`);
                data = response.data;
                // console.log(data);
            } catch (e) {
                return await interaction.reply({
                    content: "Invalid course code.",
                    ephemeral: true,
                });
            }

            const {
                title,
                code,
                UOC,
                // level,
                description,
                // study_level,
                // school,
                // campus,
                equivalents,
                raw_requirements,
                exclusions,
                // handbook_note,
                terms,
            } = data;

            const courseInfo = new EmbedBuilder()
                .setTitle(title)
                .setURL(`${handbookURL}/${code}`)
                .setColor(0x3a76f8)
                .setAuthor({ name: `Course Info: ${code} (${UOC} UOC)`, iconURL: "https://i.imgur.com/EE3Q40V.png" })
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
                            Object.keys(equivalents)
                                .map((course) => `[${course}](${course})`)
                                .join(", ") || "None",
                        inline: true,
                    },
                    {
                        name: "Exclusion Courses",
                        value:
                            Object.keys(exclusions)
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
                .setFooter({ text: "Data fetched from Circles' Api" })
            await interaction.reply({ embeds: [courseInfo] });
        }
    },
};
