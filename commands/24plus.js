//@ts-check
const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");

const MAX = 11;
const MAX_TARGET = 99;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("24plus")
        .setDescription(
            "Generates 4 random numbers from 1 to 12 and a random target from 1 to 100.",
        ),

    /**
     * @async
     * @param {ChatInputCommandInteraction} interaction
     * @returns
     */
    async execute(interaction) {
        /** @type {number[]} */
        const resultNums = [];

        for (let i = 0; i < 4; i++) {
            const random = Math.round(Math.random() * MAX) + 1;
            resultNums.push(random);
        }

        const target = Math.round(Math.random() * MAX_TARGET) + 1;

        const output = `Your numbers are: ${resultNums.join(" ")}, with a target of ${target}`;

        await interaction.reply(output);
    },
};
