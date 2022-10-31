const { SlashCommandBuilder } = require("@discordjs/builders");

const MAX = 11;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("24plus")
        .setDescription("Generates 4 random numbers from 0 to 12 and a random target from 0 to 100."),
    async execute(interaction) {
        const resultNums = [];

        for (let i = 0; i < 4; i++) {
            const random = Math.round(Math.random() * MAX) + 1;
            resultNums.push(random);
        }

        const target = Math.round(Math.random() * 99) + 1;

        const output = `Your numbers are: ${resultNums.join(" ")}, with a target of ${target}`;

        await interaction.reply(output);
    },
};
