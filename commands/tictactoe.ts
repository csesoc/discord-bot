// @ts-check
import { SlashCommandBuilder } from "discord.js";
import { createGame } from "../lib/tictactoe/tttHelper";

const baseCommand = new SlashCommandBuilder()
    .setName("tictactoe")
    .setDescription("Start a game of tictactoe");

module.exports = {
    data: baseCommand,
    execute: createGame
};
