const { SlashCommandBuilder } = require("@discordjs/builders");
const math = require('mathjs');

const MAX = 9;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("24parse")
        .setDescription("Checks whether an equation evaluates to 24 (or a number input)!")
        .addStringOption(option =>
            option.setName("equation")
                .setDescription("Equation for the 24 game")
                .setRequired(true)
        )
        .addNumberOption(option => 
            option.setName("target")
                .setDescription("Target for your equation")
                .setRequired(false)
        ),
    async execute(interaction) {
        const equationStr = interaction.options.getString("equation")
        const equationObj = math.compile(equationStr);
        const outcome = equationObj.evaluate();
        const target = interaction.options.getNumber("target") || 24;

        let polarity = 'does not equal to';
        let emoji = '❌';

        if (outcome === target) {
            polarity = 'does equal to';
            emoji = '✅';
        }

        const output = `${emoji} The equation: \`\`${equationStr}\`\` evaluates to ${outcome}, which ${polarity} the target ${target}.`;

        await interaction.reply(output);
    },
};
