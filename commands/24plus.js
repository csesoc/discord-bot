const { SlashCommandBuilder } = require("@discordjs/builders");

const MAX = 9;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("24plus")
        .setDescription("Generates 4 random numbers from 0 to 10 and a random target from 0 to 100."),
    async execute(interaction) {
        const resultNums = [];

        for (let i = 0; i < 4; i++) {
            const random = Math.round(Math.random() * MAX);
            resultNums.push(random);
        }

        const target = Math.round(Math.random() * 100);

        const output = `Your numbers are: ${resultNums.join(" ")}, with a target of ${target}`;

        await interaction.reply(output);
    },
};
