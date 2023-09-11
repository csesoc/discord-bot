import fs from 'fs';
import { Client, Collection, Partials, GatewayIntentBits, Events } from 'discord.js';
import { config as dotenvConfig } from 'dotenv';
import { EventEmitter } from 'events';


dotenvConfig();

const client: Client & { commands?: Collection<string, any> } = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
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
const initaliseBot = async (): Promise<void> => {
    client.commands = new Collection();
    const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.ts'));

    for (const file of commandFiles) {
        const command = (await import(`./commands/${file}`)).default;
        client.commands.set(command.data.name, command);
    }

    EventEmitter.defaultMaxListeners = 0;

    const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.ts'));
    for (const file of eventFiles) {
        const event = (await import(`./events/${file}`)).default;
        if (!event) continue;
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }

    client.on(Events.InteractionCreate , async (interaction): Promise<void> => {
        // console.log(interaction);
        if (!interaction.isCommand()) return;

        const command = client.commands?.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        }
    });

    client.on('shardError', (error: Error) => {
        console.error('A websocket connection encountered an error:', error);
    });

    client.login(process.env.DISCORD_TOKEN);
}

initaliseBot().catch(error => console.error("Failed to initialize bot:", error));