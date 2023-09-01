const { ChatInputCommandInteraction, InteractionResponse, SlashCommandBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!");

module.exports = {
    data,
    
    /**
     *
     * @async
     * @param {ChatInputCommandInteraction} interaction
     * @returns {Promise<InteractionResponse<boolean>>}
     */
    async execute(interaction) {
        await interaction.reply("🏓 Pong!");
    }
};
