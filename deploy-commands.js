// @ts-check
const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
require("dotenv").config();
const { env } = require("node:process");

/**
 * @type {JSON[]}
 */
const commands = [];
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    /**
     * @type {SlashCommandBuilder}
     */
    const commandData = require(`./commands/${file}`).data;
    const data = JSON.parse(JSON.stringify(commandData.toJSON()));

    commands.push(data);
}

if (env.DISCORD_TOKEN) {
    const rest = new REST().setToken(env.DISCORD_TOKEN);

    (async () => {
        try {
            console.log("Attempting to register application commands.");

            if (!env.APP_ID) throw Error("APP_ID not passed");
            await rest.put(Routes.applicationCommands(env.APP_ID), {
                body: commands,
            });

            console.log("Successfully registered application commands.");
        } catch (error) {
            console.error(error);
        }
    })();
}
