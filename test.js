const { Client, Intents, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const auroMs = require('auro-ms-conversion');

require('dotenv').config();

const PREFIX = '?';

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

let xTurn = true;

let tttGame = [
    ['⬛', '⬛', '⬛'],
    ['⬛', '⬛', '⬛'],
    ['⬛', '⬛', '⬛'],
];

const defaulttttGame = [
    ['⬛', '⬛', '⬛'],
    ['⬛', '⬛', '⬛'],
    ['⬛', '⬛', '⬛'],
];

client.on('message', async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;
    if (!client.application?.owner) await client.application?.fetch();

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'ping':
            message.reply(`Pong! Up for ${auroMs.relativeTime(client.uptime)}`);
            break;

        case 'log':
            console.table(tttGame);
            break;

        case 'deploy':
            if (message.author.id !== client.application?.owner.id) return;

            const tttdata = {
                name: 'ttt',
                description: 'Starts a Tic Tac Toe Game!',
            };

            await client.guilds.cache.get(process.env.GUILD)?.commands.create(tttdata);

            const pingdata = {
                name: 'ping',
                description: 'Responds with pong!',
            };

            await client.guilds.cache.get(process.env.GUILD)?.commands.create(pingdata);

            message.reply('Commands deployed!');

            break;
    }
});

client.on('interaction', async (interaction) => {
    if (interaction.isCommand()) {
        switch (interaction.commandName) {
            case 'ping':
                await interaction.reply(`Pong! Up for ${auroMs.relativeTime(client.uptime)}`);
                break;

            case 'ttt':
                const row1 = new MessageActionRow().addComponents([
                    new MessageButton().setCustomID('0,0').setEmoji(tttGame[0][0]).setStyle('PRIMARY'),
                    new MessageButton().setCustomID('0,1').setEmoji(tttGame[0][1]).setStyle('PRIMARY'),
                    new MessageButton().setCustomID('0,2').setEmoji(tttGame[0][2]).setStyle('PRIMARY'),
                ]);

                const row2 = new MessageActionRow().addComponents([
                    new MessageButton().setCustomID('1,0').setEmoji(tttGame[1][0]).setStyle('PRIMARY'),
                    new MessageButton().setCustomID('1,1').setEmoji(tttGame[1][1]).setStyle('PRIMARY'),
                    new MessageButton().setCustomID('1,2').setEmoji(tttGame[1][2]).setStyle('PRIMARY'),
                ]);

                const row3 = new MessageActionRow().addComponents([
                    new MessageButton().setCustomID('2,0').setEmoji(tttGame[2][0]).setStyle('PRIMARY'),
                    new MessageButton().setCustomID('2,1').setEmoji(tttGame[2][1]).setStyle('PRIMARY'),
                    new MessageButton().setCustomID('2,2').setEmoji(tttGame[2][2]).setStyle('PRIMARY'),
                ]);

                interaction.reply(`${xTurn ? "X's Turn" : "O's Turn"}`, { components: [row1, row2, row3] });

                break;
        }
    } else if (interaction.isMessageComponent()) {
        console.log(interaction.message.content);
        if (interaction.message.content.match(/(X|O) wins!/)) {
            interaction.update(`Game Over! ${xTurn ? "X's Turn" : "O's Turn"} wins!`);
            tttGame = defaulttttGame;
            return;
        }

        if (xTurn) {
            let splitID = interaction.customID.split(',');
            if (tttGame[splitID[0]][splitID[1]] === '⬛') {
                tttGame[splitID[0]][splitID[1]] = '❌';
                xTurn = false;
            }
        } else {
            let splitID = interaction.customID.split(',');
            if (tttGame[splitID[0]][splitID[1]] === '⬛') {
                tttGame[splitID[0]][splitID[1]] = '⭕';
                xTurn = true;
            }
        }
        const row1 = new MessageActionRow().addComponents([
            new MessageButton().setCustomID('0,0').setEmoji(tttGame[0][0]).setStyle('PRIMARY'),
            new MessageButton().setCustomID('0,1').setEmoji(tttGame[0][1]).setStyle('PRIMARY'),
            new MessageButton().setCustomID('0,2').setEmoji(tttGame[0][2]).setStyle('PRIMARY'),
        ]);

        const row2 = new MessageActionRow().addComponents([
            new MessageButton().setCustomID('1,0').setEmoji(tttGame[1][0]).setStyle('PRIMARY'),
            new MessageButton().setCustomID('1,1').setEmoji(tttGame[1][1]).setStyle('PRIMARY'),
            new MessageButton().setCustomID('1,2').setEmoji(tttGame[1][2]).setStyle('PRIMARY'),
        ]);

        const row3 = new MessageActionRow().addComponents([
            new MessageButton().setCustomID('2,0').setEmoji(tttGame[2][0]).setStyle('PRIMARY'),
            new MessageButton().setCustomID('2,1').setEmoji(tttGame[2][1]).setStyle('PRIMARY'),
            new MessageButton().setCustomID('2,2').setEmoji(tttGame[2][2]).setStyle('PRIMARY'),
        ]);

        // FDM
        /*  */ if (tttGame[0][0] === '❌' && tttGame[0][1] === '❌' && tttGame[0][2] === '❌') {
            // ﹉
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[1][0] === '❌' && tttGame[1][1] === '❌' && tttGame[1][2] === '❌') {
            // -
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[2][0] === '❌' && tttGame[2][1] === '❌' && tttGame[2][2] === '❌') {
            // _
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[0][0] === '❌' && tttGame[1][0] === '❌' && tttGame[2][0] === '❌') {
            // |..
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[0][1] === '❌' && tttGame[1][1] === '❌' && tttGame[2][1] === '❌') {
            // .|.
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[0][2] === '❌' && tttGame[1][2] === '❌' && tttGame[2][2] === '❌') {
            // ..|
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[2][0] === '❌' && tttGame[1][1] === '❌' && tttGame[0][2] === '❌') {
            // /
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[0][0] === '❌' && tttGame[1][1] === '❌' && tttGame[2][2] === '❌') {
            // \
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[0][0] === '⭕' && tttGame[0][1] === '⭕' && tttGame[0][2] === '⭕') {
            // ﹉
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[1][0] === '⭕' && tttGame[1][1] === '⭕' && tttGame[1][2] === '⭕') {
            // -
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[2][0] === '⭕' && tttGame[2][1] === '⭕' && tttGame[2][2] === '⭕') {
            // _
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[0][0] === '⭕' && tttGame[1][0] === '⭕' && tttGame[2][0] === '⭕') {
            // |..
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[0][1] === '⭕' && tttGame[1][1] === '⭕' && tttGame[2][1] === '⭕') {
            // .|.
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[0][2] === '⭕' && tttGame[1][2] === '⭕' && tttGame[2][2] === '⭕') {
            // ..|
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[2][0] === '⭕' && tttGame[1][1] === '⭕' && tttGame[0][2] === '⭕') {
            // /
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else if (tttGame[0][0] === '⭕' && tttGame[1][1] === '⭕' && tttGame[2][2] === '⭕') {
            // \
            tttGame = defaulttttGame;
            await interaction.update(`${xTurn ? 'O' : 'X'} wins!`, { components: [row1, row2, row3] });
        } else {
            await interaction.update(`${xTurn ? "X's Turn" : "O's Turn"}`, { components: [row1, row2, row3] });
        }
    }
});

client.login(process.env.TOKEN);