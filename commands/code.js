const voucher_codes = require("voucher-code-generator");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");
const { activeCodes } = require("../config/code.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("code")
        .setDescription("Manages reedemable codes.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("redeem")
                .setDescription("Redeems a code.")
                .addStringOption(option => option.setName("code").setDescription("Code to redeem").setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("generate")
                .setDescription("[ADMIN] Generates a redeemable code.")
                .addStringOption(option => option.setName("prefix").setDescription("Prefix of generated codes").setRequired(true))
                .addIntegerOption(option => option.setName("count").setDescription("Number of codes to generate")))
        .addSubcommand(subcommand =>
            subcommand
                .setName("activelist")
                .setDescription("[ADMIN] Displays the list of active codes.")),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "redeem") {
            const code = interaction.options.getString("code");

            if (!activeCodes.some(c => c === code)) {
                return await interaction.reply({ content: "Invalid code!", ephemeral: true });
            }

            await interaction.reply({ content: "Code redeemed successfully!", ephemeral: true });
        }

        // Admin permission check
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({ content: "You do not have permission to execute this command.", ephemeral: true });
        }

        if (interaction.options.getSubcommand() === "generate") {
            const codes = voucher_codes.generate({
                prefix: await interaction.options.getString("prefix"),
                count: await interaction.options.getInteger("count"),
                pattern: "-##########",
            });
            activeCodes.push(...codes);

            // TODO: Save activeCodes to json
            console.log(activeCodes);

            await interaction.reply(`Generated codes:\n\`\`\`${codes.join("\n")}\`\`\``);
        } else if (interaction.options.getSubcommand() === "activelist") {
            // Really temporary display
            await interaction.reply(`Active codes:\n\`\`\`${activeCodes.join("\n")}\`\`\``)
        }
    },
};

