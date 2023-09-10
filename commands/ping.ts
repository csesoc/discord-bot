// @ts-check
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply("🏓 Pong!");
    }
};