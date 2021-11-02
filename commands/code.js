const fs = require("fs");
const voucher_codes = require("voucher-code-generator");
const { SlashCommandBuilder } = require("@discordjs/builders");
const paginationEmbed = require("discordjs-button-pagination");
const { MessageEmbed, MessageButton, Permissions } = require("discord.js");
const { redeemableCodes } = require("../config/code.json");

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
                .addIntegerOption(option => option.setName("count").setDescription("Number of codes to generate"))
                .addStringOption(option => option.setName("expiry").setDescription("Expiry date and time of codes (JS supported format)"))
                .addBooleanOption(option => option.setName("onetime").setDescription("Whether the codes should only be usable once")))
        .addSubcommand(subcommand =>
            subcommand
                .setName("invalidate")
                .setDescription("[ADMIN] Invalidates an active code.")
                .addStringOption(option => option.setName("code").setDescription("Code to invalidate").setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("[ADMIN] Displays the list of codes."))
        .addSubcommand(subcommand =>
            subcommand
                .setName("getusers")
                .setDescription("[ADMIN] Displays the list of users who have redeemed a code.")
                .addStringOption(option => option.setName("code").setDescription("Code to get users for").setRequired(true))),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "redeem") {
            const code = interaction.options.getString("code");

            const result = redeemableCodes.find(el => el.code === code);

            if (!result || !result.valid) {
                return await interaction.reply({ content: "Invalid code!", ephemeral: true });
            } else if (result.users.includes(interaction.member.id)) {
                return await interaction.reply({ content: "You have already redeemed this code!", ephemeral: true });
            } else if (result.oneTime && result.users.length > 0) {
                return await interaction.reply({ content: "One time code has already been redeemed!", ephemeral: true });
            } else if (result.expiry !== -1 && result.expiry < Date.now()) {
                return await interaction.reply({ content: "Code has expired!", ephemeral: true });
            }

            result.users.push(interaction.member.id);

            // The path here is different to the require because it's called from index.js (I think)
            fs.writeFileSync("./config/code.json", JSON.stringify({ redeemableCodes }, null, 4));

            await interaction.reply({ content: "Code redeemed successfully!", ephemeral: true });
        }

        // Admin permission check
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({ content: "You do not have permission to execute this command.", ephemeral: true });
        }

        if (interaction.options.getSubcommand() === "generate") {
            const prefix = await interaction.options.getString("prefix");
            const count = Math.min(await interaction.options.getInteger("count"), 10);
            const expiry = Date.parse(await interaction.options.getString("expiry")) || -1;
            const oneTime = await interaction.options.getBoolean("onetime") ?? false;

            const codes = voucher_codes.generate({
                prefix: prefix,
                count: count,
                pattern: "-####################",
            }).map(code => ({ code, expiry, oneTime, valid: true, users: [] }));

            redeemableCodes.push(...codes);

            // The path here is different to the require because it's called from index.js (I think)
            fs.writeFileSync("./config/code.json", JSON.stringify({ redeemableCodes }, null, 4));

            const codeInfo =
                new MessageEmbed()
                    .setTitle("Generated Codes")
                    .setDescription(
                        "```\n" +
                        `${codes.map(el => el.code).join("\n")}\n` +
                        "```\n" +
                        `Expiry: ${expiry === -1 ? "Never" : (new Date(expiry)).toString()}\n` +
                        `One time: ${oneTime ? "Yes" : "No"}\n`,
                    );

            await interaction.reply({ embeds: [codeInfo] });
        } else if (interaction.options.getSubcommand() === "invalidate") {
            const code = interaction.options.getString("code");

            const result = redeemableCodes.find(el => el.code === code);

            if (!result || !result.valid) {
                return await interaction.reply({ content: "Code is already invalid!", ephemeral: true });
            }

            result.valid = false;

            // The path here is different to the require because it's called from index.js (I think)
            fs.writeFileSync("./config/code.json", JSON.stringify({ redeemableCodes }, null, 4));

            await interaction.reply(`Invalidated code: \`${code}\``);
        } else if (interaction.options.getSubcommand() === "list") {
            const codesPerPage = 10;

            const embedList = [];
            for (let i = 0; i < redeemableCodes.length; i += codesPerPage) {
                embedList.push(
                    new MessageEmbed()
                        .setTitle("Code List")
                        .setDescription(
                            redeemableCodes
                                .slice(i, i + codesPerPage)
                                .map(el => {
                                    return (
                                        "```diff\n" +
                                        `${el.valid ? "+" : "-"} ${el.code}\n` +
                                        "```\n" +
                                        `Expiry: ${el.expiry === -1 ? "Never" : (new Date(el.expiry)).toString()}\n` +
                                        `One time: ${el.oneTime ? el.users.length > 0 ? "Yes [USED]" : "Yes" : "No"}\n`
                                    );
                                })
                                .join("\n\n"),
                        ),
                );
            }

            const buttonList = [
                new MessageButton()
                    .setCustomId("previousbtn")
                    .setLabel("Previous")
                    .setStyle("DANGER"),
                new MessageButton()
                    .setCustomId("nextbtn")
                    .setLabel("Next")
                    .setStyle("SUCCESS"),
            ];

            paginationEmbed(interaction, embedList, buttonList);
        } else if (interaction.options.getSubcommand() === "getusers") {
            const usersPerPage = 20;

            const code = interaction.options.getString("code");

            const result = redeemableCodes.find(el => el.code === code);

            if (!result) {
                return await interaction.reply({ content: "Code does not exist!", ephemeral: true });
            }

            const embedList = [];
            for (let i = 0; i < result.users.length; i += usersPerPage) {
                embedList.push(
                    new MessageEmbed()
                        .setTitle("Users")
                        .setDescription(
                            result.users
                                .slice(i, i + usersPerPage)
                                .map(el => `<@${el}>`)
                                .join("\n"),
                        ),
                );
            }

            const buttonList = [
                new MessageButton()
                    .setCustomId("previousbtn")
                    .setLabel("Previous")
                    .setStyle("DANGER"),
                new MessageButton()
                    .setCustomId("nextbtn")
                    .setLabel("Next")
                    .setStyle("SUCCESS"),
            ];

            paginationEmbed(interaction, embedList, buttonList);
        }
    },
};

