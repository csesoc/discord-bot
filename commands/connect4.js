const { SlashCommandBuilder } = require("@discordjs/builders");
const { createConnect4 } = require('../lib/connect4/connect4Runner');

const baseCommand = new SlashCommandBuilder()
    .setName("connect4")
    .setDescription("Start a game of connect 4");

module.exports = {
    data: baseCommand,
    execute: createConnect4,
}