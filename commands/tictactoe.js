const { SlashCommandBuilder } = require("@discordjs/builders");
const { Client, Intents, MessageActionRow, MessageButton, MessageEmbed, SystemChannelFlags, ButtonInteraction } = require('discord.js');

const auroMs = require('auro-ms-conversion');

const tictactoe = new SlashCommandBuilder()
    .setName("tictactoe")
    .setDescription("Simple Tic Tac Toe game");

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


async function startGame(interaction) {
    
    const row1 = new MessageActionRow().addComponents([
        new MessageButton().setCustomId('0,0').setEmoji(tttGame[0][1]).setStyle('PRIMARY'),
        new MessageButton().setCustomId('0,1').setEmoji(tttGame[0][1]).setStyle('PRIMARY'),
        new MessageButton().setCustomId('0,2').setEmoji(tttGame[0][2]).setStyle('PRIMARY'),
    ]);

    const row2 = new MessageActionRow().addComponents([
        new MessageButton().setCustomId('1,0').setEmoji(tttGame[1][0]).setStyle('PRIMARY'),
        new MessageButton().setCustomId('1,1').setEmoji(tttGame[1][1]).setStyle('PRIMARY'),
        new MessageButton().setCustomId('1,2').setEmoji(tttGame[1][2]).setStyle('PRIMARY'),
    ]);

    const row3 = new MessageActionRow().addComponents([
        new MessageButton().setCustomId('2,0').setEmoji(tttGame[2][0]).setStyle('PRIMARY'),
        new MessageButton().setCustomId('2,1').setEmoji(tttGame[2][1]).setStyle('PRIMARY'),
        new MessageButton().setCustomId('2,2').setEmoji(tttGame[2][2]).setStyle('PRIMARY'),
    ]);
    interaction.reply({ content: `${xTurn ? "X's Turn" : "O's Turn"}`, components: [row1, row2, row3] });    
    
    let m = await interaction.fetchReply()
    const collector = m.createMessageComponentCollector({
        type: 'BUTTON',
        time: 30000
    });
    collector.on('collect', async (button) => {
        // if (interaction.content.match(/(X|O) wins!/)) {c
        //     interaction.update({content: `Game Over! ${xTurn ? "X's Turn" : "O's Turn"} wins!`});
        //     tttGame = defaulttttGame;
        //     return;
        // }
         // return button.reply({
        //     content: 'You cant play the game as they didnt call u to play.'
        // });
        return button.reply({
            content: `${button.customID} ${ButtonInteraction.customID} ${MessageButton.customID}`
        });

        if (xTurn) {
            print(interaction.customID);
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
            new MessageButton().setCustomId('0,0').setEmoji(tttGame[0][0]).setStyle('PRIMARY'),
            new MessageButton().setCustomId('0,1').setEmoji(tttGame[0][1]).setStyle('PRIMARY'),
            new MessageButton().setCustomId('0,2').setEmoji(tttGame[0][2]).setStyle('PRIMARY'),
        ]);

        const row2 = new MessageActionRow().addComponents([
            new MessageButton().setCustomId('1,0').setEmoji(tttGame[1][0]).setStyle('PRIMARY'),
            new MessageButton().setCustomId('1,1').setEmoji(tttGame[1][1]).setStyle('PRIMARY'),
            new MessageButton().setCustomId('1,2').setEmoji(tttGame[1][2]).setStyle('PRIMARY'),
        ]);

        const row3 = new MessageActionRow().addComponents([
            new MessageButton().setCustomId('2,0').setEmoji(tttGame[2][0]).setStyle('PRIMARY'),
            new MessageButton().setCustomId('2,1').setEmoji(tttGame[2][1]).setStyle('PRIMARY'),
            new MessageButton().setCustomId('2,2').setEmoji(tttGame[2][2]).setStyle('PRIMARY'),
        ]);

        // FDM
        /*  */ if (tttGame[0][0] === '❌' && tttGame[0][1] === '❌' && tttGame[0][2] === '❌') {
            // ﹉
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[1][0] === '❌' && tttGame[1][1] === '❌' && tttGame[1][2] === '❌') {
            // -
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[2][0] === '❌' && tttGame[2][1] === '❌' && tttGame[2][2] === '❌') {
            // _
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[0][0] === '❌' && tttGame[1][0] === '❌' && tttGame[2][0] === '❌') {
            // |..
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[0][1] === '❌' && tttGame[1][1] === '❌' && tttGame[2][1] === '❌') {
            // .|.
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[0][2] === '❌' && tttGame[1][2] === '❌' && tttGame[2][2] === '❌') {
            // ..|
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[2][0] === '❌' && tttGame[1][1] === '❌' && tttGame[0][2] === '❌') {
            // /
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[0][0] === '❌' && tttGame[1][1] === '❌' && tttGame[2][2] === '❌') {
            // \
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[0][0] === '⭕' && tttGame[0][1] === '⭕' && tttGame[0][2] === '⭕') {
            // ﹉
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[1][0] === '⭕' && tttGame[1][1] === '⭕' && tttGame[1][2] === '⭕') {
            // -
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[2][0] === '⭕' && tttGame[2][1] === '⭕' && tttGame[2][2] === '⭕') {
            // _
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[0][0] === '⭕' && tttGame[1][0] === '⭕' && tttGame[2][0] === '⭕') {
            // |..
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[0][1] === '⭕' && tttGame[1][1] === '⭕' && tttGame[2][1] === '⭕') {
            // .|.
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[0][2] === '⭕' && tttGame[1][2] === '⭕' && tttGame[2][2] === '⭕') {
            // ..|
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[2][0] === '⭕' && tttGame[1][1] === '⭕' && tttGame[0][2] === '⭕') {
            // /
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else if (tttGame[0][0] === '⭕' && tttGame[1][1] === '⭕' && tttGame[2][2] === '⭕') {
            // \
            tttGame = defaulttttGame;
            await interaction.update({content: `${xTurn ? 'O' : 'X'} wins!`,  components: [row1, row2, row3] });
        } else {
            await interaction.update({content: `${xTurn ? "X's Turn" : "O's Turn"}`, components: [row1, row2, row3] });
        }
       
    });

    
        
}

// async function loadGame(interaction) {
// }

// async function playGame(interaction) {
// }

module.exports = {
    data: tictactoe,
    execute: startGame,
};
