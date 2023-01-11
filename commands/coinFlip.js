const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("coinflip").setDescription("Tosses a coin 💰"),
    async execute(interaction) {
        const coinNum = await Math.floor(Math.random() * 2);
        const coin = coinNum === 0 ? "heads" : "tails";
        /*
    let img =
      coinNum === 0
        ? 'https://assets.gadgets360cdn.com/img/crypto/dogecoin-og-logo.png'
        : 'http://assets.stickpng.com/thumbs/5a521f522f93c7a8d5137fc7.png';
    */
        const img = coinNum === 0 ? "attachment://heads.png" : "attachment://tails.png";
        const embed = new MessageEmbed().setTitle(`it's ${coin}!`).setImage(img);
        if (coinNum == 0) {
            return await interaction.reply({
                embeds: [embed],
                files: ["./config/cointoss_images/heads.png"],
            });
        } else {
            return await interaction.reply({
                embeds: [embed],
                files: ["./config/cointoss_images/tails.png"],
            });
        }
    },
};
