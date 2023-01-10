const { SlashCommandBuilder } = require("@discordjs/builders");
const { isNaN } = require("mathjs");
const { Util } = require("discord.js");
const math = require("mathjs");
const { Util } = require("discord.js");

const illegalPhraseRegexes = [ /`/g, /@/g ];

const isIllegalCharactersPresent = (expression) => {
    return illegalPhraseRegexes.some((regex) => regex.test(expression));
};

const evaluate = (equationString, target) => {
    if (isIllegalCharactersPresent(equationString)) {
        return {
            success: false,
            message: "Could not compile. Illegal input detected.",
            ephemeral: true,
        };
    }

    const equationObj = math.compile(equationString);
    if (!equationObj) {
        return {
            success: false,
            message: "Could not compile. The equation is invalid.",
            ephemeral: true,
        };
    }

    const equationOutcome = equationObj.evaluate();
    const outcomeAsNumber = Number(equationOutcome);
    if (isNaN(outcomeAsNumber)) {
        return {
            success: false,
            message: "Could not compile. The equation does not evaluate to a number.",
            ephemeral: true,
        };
    }

    return (outcomeAsNumber == target) ? {
        success: true,
        message: `Correct! \`${equationString}\` = ${target}, which is equal to the target`,
        ephemeral: false,
    } : {
        success: false,
        message: `Incorrect. \`${equationString}\` = ${outcomeAsNumber}, which is not equal to the target`,
        ephemeral: false,
    };

};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("24parse")
        .setDescription("Checks whether an equation evaluates to 24 (or a number input)!")
        .addStringOption((option) =>
            option.setName("equation").setDescription("Equation for the 24 game").setRequired(true),
        )
        .addNumberOption((option) =>
            option.setName("target").setDescription("Target for your equation").setRequired(false),
        ),
    async execute(interaction) {
        const equationStr = interaction.options.getString("equation");
        const target = interaction.options.getNumber("target") || 24;

        const { success, message, ephemeral } = evaluate(equationStr, target);

        const emoji = (success) ? "❌" : "✅";
        const output = `${emoji} ${message}`;

        await interaction.reply({
            content: Util.removeMentions(output),
            ephemeral,
        });
    },
};

