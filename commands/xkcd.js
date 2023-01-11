const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xkcd")
        .setDescription("Replies with a new xkcd joke!")
        .addSubcommand((subcommand) =>
            subcommand.setName("latest").setDescription("Get the latest xkcd comic."),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("get")
                .setDescription("Get xkcd comic by its id.")
                .addIntegerOption((option) =>
                    option
                        .setName("comic-id")
                        .setRequired(true)
                        .setDescription("The number id of the xkcd comic you want to get"),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("random").setDescription("Get a random xkcd comic."),
        ),
    async execute(interaction) {
        const xkcd = require("xkcd-api");

        if (interaction.options.getSubcommand() === "latest") {
            xkcd.latest(async function (error, response) {
                if (error) {
                    console.log(error);
                    interaction.reply({
                        content: `sorry something went wrong!😔`,
                        ephemeral: true,
                    });
                } else {
                    const embed = new MessageEmbed()
                        .setTitle(response.safe_title)
                        .setImage(response.img);
                    return await interaction.reply({ embeds: [embed] });
                }
            });
        } else if (interaction.options.getSubcommand() === "get") {
            const comic_id = interaction.options.getInteger("comic-id");

            xkcd.get(comic_id, async function (error, response) {
                if (error) {
                    console.log(error);
                    interaction.reply({
                        content: error,
                        ephemeral: true,
                    });
                } else {
                    const embed = new MessageEmbed()
                        .setTitle(response.safe_title)
                        .setImage(response.img);
                    return await interaction.reply({ embeds: [embed] });
                }
            });
        } else if (interaction.options.getSubcommand() === "random") {
            xkcd.random(async function (error, response) {
                if (error) {
                    console.log(error);
                    interaction.reply({
                        content: `sorry something went wrong!😔`,
                        ephemeral: true,
                    });
                } else {
                    const embed = new MessageEmbed()
                        .setTitle(response.safe_title)
                        .setImage(response.img);
                    return await interaction.reply({ embeds: [embed] });
                }
            });
        }
    },
};
