// @ts-check
import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import axios from "axios";

module.exports = {
    data: new SlashCommandBuilder().setName("joke").setDescription("Replies with a new joke!"),

    /**
     * @async
     * @param {ChatInputCommandInteraction} interaction
     * @returns 
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const res = await axios.get("https://official-joke-api.appspot.com/random_joke");
            const embed = new EmbedBuilder()
                .setTitle(res.data.setup)
                .setDescription(res.data.punchline);

            interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.log(error);
            interaction.reply({
                content: `sorry something went wrong!😔`,
                ephemeral: true,
            });
        }
    },
};
