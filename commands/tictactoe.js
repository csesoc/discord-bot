// @ts-check
const { SlashCommandBuilder } = require("discord.js");
const { createGame } = require("../lib/tictactoe/tttHelper");

const baseCommand = new SlashCommandBuilder()
    .setName("tictactoe")
    .setDescription("Start a game of tictactoe");

module.exports = {
    data: baseCommand,
    execute: createGame
};
