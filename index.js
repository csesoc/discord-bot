// @ts-check
const fs = require("fs");
const { Client, Collection, GatewayIntentBits, InteractionType, Partials, CommandInteraction, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const { env } = require("node:process");

// Create a new client instance
const client = new Client({
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
        Partials.User
    ],
});

// Add commands to the client
/** 
 */
client.commands = new Collection();
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    /**
     * @type {{data: SlashCommandBuilder, interaction: CommandInteraction}}
     */
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

require("events").EventEmitter.defaultMaxListeners = 0;

// Add events to the client
const eventFiles = fs.readdirSync("./events").filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Handle commands
client.on("interactionCreate", async (interaction) => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
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

// client.once("ready", () => {
//     console.log(`Bot ${client.user.username} is ready!`);
// })

client.login(env.DISCORD_TOKEN);
