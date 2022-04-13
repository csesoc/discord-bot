const axios = require("axios");
const help = require("../config/help.json");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays info for all commands. Also type / in the chat to check out other commands."),
    async execute() {
        // Load "../config/help.json"
        const commands = help.commands;
        const helpEmbed = new MessageEmbed()
            .setTitle("Help")
            .setColor(0x3A76F8)
            .setAuthor("UNSW Bot", "https://i.imgur.com/EE3Q40V.png");
        for (let i = 0; i < commands.length; i++) {
            const name = commands[i].name;
            const description = commands[i].description;
            const usage = "\nUsage: " + commands[i].usage;
            helpEmbed.addField(name, description + usage, false);
        }
    },
};

