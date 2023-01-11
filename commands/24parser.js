const { SlashCommandBuilder } = require("@discordjs/builders");
const math = require("mathjs");
const { Util } = require("discord.js");

const illegalPhraseRegexes = [/`/g, /@/g];

const isIllegalCharactersPresent = (expression) => {
    return illegalPhraseRegexes.some((regex) => regex.test(expression));
};

const tryCompileAndEvaluate = (eqnString) => {
    try {
        const equationObj = math.compile(eqnString);
        if (!equationObj) {
            throw Error;
        }

        const equationOutcome = equationObj.evaluate();

        return {
            success: true,
            equationOutcome,
        };

    } catch (e) {
        return {
            success: false,
            message: "Could not compile. The equation is invalid.",
            ephemeral: true,
        };
    }
};

const evaluate = (equationString, target) => {
    if (isIllegalCharactersPresent(equationString)) {
        return {
            success: false,
            message: "Could not compile. Illegal input detected.",
            ephemeral: true,
        };
    }

    const evaluationOutcome = tryCompileAndEvaluate(equationString);
    if (!evaluationOutcome.success) {
        return {
            success: false,
            message: evaluationOutcome.message,
            ephemeral: true,
        };
    }
    const { equationOutcome } = evaluationOutcome;

    const outcomeAsNumber = Number(equationOutcome);
    if (math.isNaN(outcomeAsNumber)) {
        return {
            success: false,
            message: "Could not compile. The equation does not evaluate to a number.",
            ephemeral: true,
        };
    }

    return outcomeAsNumber == target
    ? {
        success: true,
        message: `Correct! \`${equationString}\` = ${target}, which is equal to the target.`,
        ephemeral: false,
      }
    : {
        success: false,
        message: `Incorrect. \`${equationString}\` = ${outcomeAsNumber}, which is not equal to the target of ${target}.`,
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

        const emoji = success ? "✅" : "❌";
        const output = `${emoji} ${message}`;

        await interaction.reply({
            content: Util.removeMentions(output),
            ephemeral,
        });
    },
};

