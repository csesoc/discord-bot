const { SlashCommandBuilder } = require("@discordjs/builders");

const MAX = 9;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("24")
        .setDescription("Generates 4 random numbers from 0 to 9!"),
    async execute(interaction) {
        const resultNums = [];

        for (let i = 0; i < 4; i++) {
            const random = Math.round(Math.random() * MAX);
            resultNums.push(random);
        }

        const output = `Your numbers are: ${resultNums.join(" ")}`;

        await interaction.reply(output);
    },
};
