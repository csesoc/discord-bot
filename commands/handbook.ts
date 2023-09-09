// @ts-check
const axios = require("axios").default;
import textVersion from "textversionjs";
import { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { apiURL, handbookURL } from "../config/handbook.json";

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
    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === "courseinfo") {
            const courseCode = interaction.options.getString("coursecode", true).toUpperCase();

            interface CourseData {
                title: string;
                code: string;
                UOC: number;
                level: number;
                description: string;
                study_level: string;
                handbook_note: string;
                school: string;
                faculty: string;
                campus: string;
                equivalents: Record<string, number>;
                exclusions: Record<string, number>;
                terms: string[];
                raw_requirements: string;
                gen_ed: boolean;
            }

            let data: CourseData | null = null;
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
            
            if (data == null) return;
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

        return Promise.resolve();
    },
};
