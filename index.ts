// @ts-check
import fs from "fs";
import {
    Client,
    Collection,
    GatewayIntentBits,
    InteractionType,
    Partials,
    Interaction,
    ClientOptions,
} from "discord.js";
require("dotenv").config();
import { env } from "node:process";

/**
 * @typedef {{data: SlashCommandBuilder, execute: (interaction: CommandInteraction) => Promise<void>}} commandExport
 */

class CseClient extends Client {
    commands: Collection<any, any>
    /** @param {ClientOptions} options */
    constructor(options: ClientOptions) {
        super(options);

        this.commands = new Collection();
    }
}

// Create a new client instance
const client = new CseClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User,
    ],
});

// Add commands to the client
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".ts"));

for (const file of commandFiles) {
    /** @type {commandExport} */
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

require("events").EventEmitter.defaultMaxListeners = 0;

// Add events to the client
const eventFiles = fs.readdirSync("./events").filter((file) => file.endsWith(".ts"));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args: any[]) => event.execute(...args));
    } else {
        client.on(event.name, (...args: any[]) => event.execute(...args));
    }
}

// Handle commands
client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error: any) {
        console.error(error);
        await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
});

client.on("shardError", (error) => {
    console.error("A websocket connection encountered an error:", error);
});

client.login(env.DISCORD_TOKEN);
