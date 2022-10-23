const { data } = require("../config/jokes.json");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder().setName("joke").setDescription("Replies with a random joke!"),
    async execute(interaction) {
        const r = Math.floor(Math.random() * data.length);
        const randJoke = data[r];
        await interaction.reply(randJoke.body);
    },
};
