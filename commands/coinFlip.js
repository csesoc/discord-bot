const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Tosses a coin 🪙'),
  async execute(interaction) {
    let coinNum = await Math.floor(Math.random() * 2);
    if (coinNum == 0) {
      await interaction.reply('Heads');
    } else {
      await interaction.reply('Tails');
    }
  },
};
