const { SlashCommandBuilder } = require("@discordjs/builders");
const { game } = require('../lib/tictactoe/ttcGame')
const { createGameId, gameToButtons } = require('../lib/tictactoe/ttcHelper')

var gamesAlive = new Object()

const baseCommand = new SlashCommandBuilder()
    .setName("ttc")
    .setDescription("Start a game of tictactoe")

async function createGame(interaction) {
    if (!interaction.isCommand()) return
    const newGame = new game()
    const newGameId = createGameId()
    gamesAlive[newGameId] = newGame

    interaction.reply({
        content: 'Waiting for player 1',
        components: gameToButtons(newGame, newGameId)
    })
    setTimeout(() => {
        delete gamesAlive[newGameId]
    }, 3600000)
}
async function handleGameButton(interaction) {
    if (!interaction.isButton()) return
    const { member } = interaction
    const gameIdxy = interaction.customId.split(":")
    let gameObj = gamesAlive[gameIdxy[0]]
    
    if (gameObj == undefined) {
        interaction.reply({
            content: 'This game is no longer running.',
            ephemeral: true
        })
        return
    }
    if (gameObj.players.length == 0) {
        gameObj.players[0] = member.id
    }
    else if (gameObj.players.length == 1) {
        gameObj.players[1] = member.id
    }
    else if (gameObj.players[gameObj.turnOf] != member.id) {
        interaction.reply({
            content: "It is not your turn.",
            ephemeral: true
        })
    }
    gameObj.board[gameIdxy[1]][gameIdxy[2]] = gameObj.turnOf
    
    if (gameObj.getGameOver) {
        interaction.update({
            content: `<@${gameObj.players[gameObj.turnOf]}> wins`,
            components: gameToButtons(gameObj, gameIdxy[0])
        })
        delete gamesAlive[gameIdxy[0]]
        return
    }

    gameObj.turnOf = gameObj.turnOf ? 0 : 1
    const nextPlayerId = gameObj.players[gameObj.turnOf]
    const messageContent = nextPlayerId == undefined ? "Waiting for player 2" : `<@${nextPlayerId}>'s turn`

    interaction.update({
        content: messageContent,
        components: gameToButtons(gameObj, gameIdxy[0])
    })
}

module.exports = {
    data: baseCommand,
    execute: createGame,
    handleGameButton: handleGameButton
}