const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const axios = require("axios").default;

module.exports = {
    data: new SlashCommandBuilder().setName("joke").setDescription("Replies with a new joke!"),
    async execute(interaction) {
        axios
            .get("https://official-joke-api.appspot.com/random_joke")
            .then((res) => {
                // console.log(res.data);
                const embed = new MessageEmbed()
                    .setTitle(res.data.setup)
                    .setDescription(res.data.punchline);

                interaction.reply({ embeds: [embed], ephemeral: true });
            })
            .catch((err) => {
                console.log(err);
                interaction.reply({
                    content: `sorry something went wrong!😔`,
                    ephemeral: true,
                });
            });
    },
};
