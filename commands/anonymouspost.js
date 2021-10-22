const { SlashCommandBuilder } = require("@discordjs/builders");
const { channel } = require("diagnostics_channel");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("anonymouspost")
        .setDescription("Make a post anonymously, the bot will send it on your behalf.")
        .addStringOption(option => option.setName('message').setDescription("Enter the text you wish to post anonymously")),
    async execute(interaction) {
        const text = interaction.options.getString('message');

        interaction.reply({ content: "Done!", ephemeral: true});
        interaction.guild.channels.cache.get(interaction.channelId).send(text + '\n\n(The above message was anonymously posted by a user)')
    },
}