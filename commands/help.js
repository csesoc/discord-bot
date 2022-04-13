const help = require("../config/help.json");
const { SlashCommandBuilder } = require("@discordjs/builders");

const { MessageEmbed } = require("discord.js");

module.exports = {
    // Add new /help command
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays info for all commands. Also type / in the chat to check out other commands."),
    async execute(interaction) {
        // Load help which stores all command info from ..config/help.json"
        const commands = help.commands;
        const helpEmbed = new MessageEmbed()
            .setTitle("Help Command")
            .setColor(0x3A76F8)
            .setAuthor("CSESoc Bot", "https://i.imgur.com/EE3Q40V.png");
        for (let i = 0; i < commands.length; i++) {
            const name = i + 1 + ". " +commands[i].name;
            const description = commands[i].description;
            const usage = "\nUsage: " + commands[i].usage;
            // console.log(name + " " + description);
            helpEmbed.addField(name, description + usage, false);
        }
        interaction.channel.send({ embeds: [helpEmbed] });
    },
};

