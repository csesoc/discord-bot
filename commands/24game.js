const { SlashCommandBuilder } = require("@discordjs/builders");

const MAX = 9;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("24")
        .setDescription("Generates 4 random numbers from 0 to 9!"),
    async execute(interaction) {
        let resultNums = [];

        for (let i = 0; i < 4; i++) {
            let random = Math.round(Math.random() * MAX);
            resultNums.push(random);
        }

        let output = `Your numbers are: ${resultNums.join(" ")}`;

        await interaction.reply(output);
    },
};
