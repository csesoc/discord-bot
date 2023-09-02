const { SlashCommandBuilder, CommandInteraction } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),

    /**
     *
     * @async
     * @param {CommandInteraction} interaction
     * @returns
     */
    async execute(interaction) {
        await interaction.reply("🏓 Pong!");
    }
};
