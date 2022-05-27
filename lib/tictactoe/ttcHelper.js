const { MessageActionRow, MessageButton } = require('discord.js')

function createGameId() {
    const dateObj = new Date()
    return dateObj.getTime().toString()
}

function gameToButtons(gameObj, gameId) {
    const messageRows = []
    const dim = Math.min(gameObj.dim, 5)
    for (let i = 0; i < dim; i++) {
        const rowButtons = []
        for (let j = 0; j < dim; j++) {
            let style = "SECONDARY"
            let label = " "
            const disableButton = gameObj.board[i][j] != -1
            if (disableButton) {
                label = gameObj.board[i][j] ? "O" : "X"
                style = gameObj.board[i][j] ? "PRIMARY" : "DANGER"
            }
            rowButtons[j] = new MessageButton()
                .setCustomId(`${gameId}:${i}:${j}`)
                .setLabel(label)
                .setStyle(style)
                .setDisabled(disableButton);
        }
        messageRows[i] = new MessageActionRow().addComponents(
            rowButtons
        )
    }
    return messageRows
}

module.exports = { createGameId, gameToButtons }