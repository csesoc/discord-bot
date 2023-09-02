const { 
    InteractionResponse, 
    CommandInteraction, 
    EmbedBuilder, 
    SlashCommandBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("coinflip").setDescription("Tosses a coin 💰"),

    /**
     *
     * @async
     * @param {CommandInteraction} interaction
     * @returns
     */
    async execute(interaction) {
        const coinNum = Math.floor(Math.random() * 2);
        const coin = coinNum === 0 ? "heads" : "tails";
        
        const img = coinNum === 0 ? "attachment://heads.png" : "attachment://tails.png";
        const file = coinNum === 0 ? "./config/cointoss_images/heads.png" : "./config/cointoss_images/tails.png";
        const embed = new EmbedBuilder().setTitle(`it's ${coin}!`).setImage(img);
        return await interaction.reply({
            embeds: [embed],
            files: [file],
        });
    },
};
