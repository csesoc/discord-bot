const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios').default;
module.exports = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Replies with a new joke!'),
  async execute(interaction) {
    const joke = axios
      .get('https://official-joke-api.appspot.com/random_joke')
      .then((res) => {
        interaction.reply(res);
      })
      .catch((err) => {
        interaction.reply(`sorry something went wrong!😔`);
      });
  },
};
