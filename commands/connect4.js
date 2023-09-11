import { SlashCommandBuilder } from "discord.js";
import { createConnect4 } from "../lib/connect4/connect4Runner";

const baseCommand = new SlashCommandBuilder()
    .setName("connect4")
    .setDescription("Start a game of connect 4");

module.exports = {
    data: baseCommand,
    execute: createConnect4,
};