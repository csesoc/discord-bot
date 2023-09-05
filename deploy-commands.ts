import * as fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import dotenv from 'dotenv';

dotenv.config();

const commands: string[] = []; 

function loadCommands() {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        // Note: Dynamic imports return promises.
        const commandImport = import(`./commands/${file}`);
        commandImport.then(command => {
            commands.push(command.data.toJSON());
        });
    }
}

loadCommands();
console.log(process.env.DISCORD_TOKEN);
if (!process.env.DISCORD_TOKEN) {
    throw new Error("DISCORD_TOKEN is not defined in the environment variables!");
}
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Attempting to register application commands.');

        // You should wait for all commands to be loaded before proceeding
        // Especially important if there's any delay or async operation in loadCommands
        await Promise.all(commands);

        await rest.put(Routes.applicationCommands(process.env.APP_ID as string), {
            body: commands,
        });

        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
})();