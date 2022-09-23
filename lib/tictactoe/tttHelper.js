const { MessageActionRow, MessageButton } = require("discord.js");
const { game } = require("./tttGame");

const maxNumGames = 1000;

const gamesAlive = new Object();

function createGameId() {
    const dateObj = new Date();
    return dateObj.getTime().toString();
}

function gameToButtons(gameObj, gameId) {
    const messageRows = [];
    const dim = Math.min(gameObj.dim, 5);
    for (let i = 0; i < dim; i++) {
        const rowButtons = [];
        for (let j = 0; j < dim; j++) {
            let style = "SECONDARY";
            let label = " ";
            const disableButton = gameObj.board[i][j] != -1;
            if (disableButton) {
                label = gameObj.board[i][j] ? "O" : "X";
                style = gameObj.board[i][j] ? "PRIMARY" : "DANGER";
            }
            rowButtons[j] = new MessageButton()
                .setCustomId(`${gameId}:${i}:${j}`)
                .setLabel(label)
                .setStyle(style)
                .setDisabled(disableButton);
        }
        messageRows[i] = new MessageActionRow().addComponents(rowButtons);
    }
    return messageRows;
}

async function createGame(interaction) {
    if (!interaction.isCommand()) return;
    const newGame = new game();
    const newGameId = createGameId();

    // limit on number of games
    if (Object.keys(gamesAlive).length >= maxNumGames) {
        delete gamesAlive[Object.keys(gamesAlive)[0]];
    }

    gamesAlive[newGameId] = newGame;

    interaction.reply({
        content: "Waiting for player 1",
        components: gameToButtons(newGame, newGameId),
    });
    setTimeout(() => {
        delete gamesAlive[newGameId];
    }, 3600000);
}

async function handleGameButton(interaction) {
    if (!interaction.isButton()) return;
    const { member } = interaction;
    const gameIdxy = interaction.customId.split(":");
    const gameObj = gamesAlive[gameIdxy[0]];

    if (gameObj == undefined) {
        interaction.reply({
            content: "This game is no longer running.",
            ephemeral: true,
        });
        return;
    }
    if (gameObj.players.length == 0) {
        gameObj.players[0] = member.id;
    } else if (gameObj.players.length == 1) {
        //
        if (member.id == gameObj.players[0]) {
            interaction.reply({
                content: "You cannot be both players",
                ephemeral: true,
            });
            return;
        } else {
            gameObj.players[1] = member.id;
        }
        //
        // gameObj.players[1] = member.id; // <- to test on single acct
        // uncomment this line, comment out above block between //'s
    } else if (gameObj.players[gameObj.turnOf] != member.id) {
        interaction.reply({
            content: "It is not your turn.",
            ephemeral: true,
        });
        return;
    }

    gameObj.board[gameIdxy[1]][gameIdxy[2]] = gameObj.turnOf;
    if (gameObj.getGameOver) {
        interaction.update({
            content: `<@${gameObj.players[gameObj.turnOf]}> wins`,
            components: gameToButtons(gameObj, gameIdxy[0]),
        });
        delete gamesAlive[gameIdxy[0]];
        return;
    } else if (--gameObj.movesLeft == 0) {
        interaction.update({
            content: "Draw!",
            components: gameToButtons(gameObj, gameIdxy[0]),
        });
        delete gamesAlive[gameIdxy[0]];
        return;
    }

    gameObj.turnOf = gameObj.turnOf ? 0 : 1;
    const nextPlayerId = gameObj.players[gameObj.turnOf];
    const messageContent =
        nextPlayerId == undefined ? "Waiting for player 2" : `<@${nextPlayerId}>'s turn`;

    interaction.update({
        content: messageContent,
        components: gameToButtons(gameObj, gameIdxy[0]),
    });
}

module.exports = {
    createGameId,
    gameToButtons,
    createGame,
    handleGameButton,
};
