import fs from 'fs';
import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands: string[] = [];

async function loadCommands(): Promise<void[]> {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));

    const promises = commandFiles.map(async (file) => {
        const command = (await import(`./commands/${file}`)).default;
        if (command && command.data) {
            // console.log(command);
            commands.push(command.data.toJSON());
        }
    });

    return Promise.all(promises);
}

if (!process.env.DISCORD_TOKEN) {
    throw new Error("DISCORD_TOKEN is not defined in the environment variables!");
}
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Attempting to register application commands.');
        
        // Ensure commands are loaded
        await loadCommands();

        console.log(`Loaded ${commands.length} commands.`);
        const data = await rest.put(Routes.applicationCommands(process.env.APP_ID as string), {
            body: commands,
        });

        if (data) {
            console.log(`Successfully reloaded ${data} application (/) commands.`);
        }
    } catch (error) {
        console.error(error);
    }
})();