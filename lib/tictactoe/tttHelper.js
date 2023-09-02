const { ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, ButtonStyle, BaseInteraction } = require("discord.js");
const { game } = require("./tttGame");

const maxNumGames = 1000;

// gamesAlive is an object of <gameId, game> key-value pairs
/** @type {Record<string, game>} */
const gamesAlive = {};

const createGameId = () => new Date().getTime().toString();

/**
 * 
 * @param {game} gameObj 
 * @param {number} gameId 
 * @returns {ActionRowBuilder[]}
 */
const gameToButtons = (gameObj, gameId) => {
    /** @type {ActionRowBuilder[]} */
    let messageRows = [];
    
    const dim = Math.min(gameObj.dim, 5);
    for (let i = 0; i < dim; i++) {
        /** @type {ButtonBuilder[]} */
        let rowButtons = [];
        for (let j = 0; j < dim; j++) {
            let style = ButtonStyle.Secondary;
            let label = "\u200B";
            const disableButton = gameObj.board[i][j] != -1;
            if (disableButton) {
                label = gameObj.board[i][j] ? "O" : "X";
                style = gameObj.board[i][j] ? ButtonStyle.Primary : ButtonStyle.Danger;
            }
            rowButtons[j] = new ButtonBuilder()
                .setCustomId(`${gameId}:${i}:${j}`)
                .setLabel(label)
                .setStyle(style)
                .setDisabled(disableButton);
        }
        messageRows[i] = new ActionRowBuilder().addComponents(rowButtons);
    }
    return messageRows;
}

/**
 *
 * @async
 * @param {ChatInputCommandInteraction} interaction
 * @returns
 */
const createGame = async (interaction) => {
    if (!interaction.isCommand()) return;
    const newGame = new game();
    const newGameId = createGameId();

    // limit on number of games
    if (Object.keys(gamesAlive).length >= maxNumGames) {
        delete gamesAlive[Object.keys(gamesAlive)[0]];
    }

    gamesAlive[newGameId] = newGame;
    
    await interaction.reply({
        content: "Waiting for player 1",
        components: gameToButtons(newGame, newGameId),
    });
    setTimeout(() => delete gamesAlive[newGameId], 3600000);
}

/**
 *
 * @async
 * @param {BaseInteraction} interaction
 * @returns
 */
const handleGameButton = async (interaction) => {
    console.log(`Reached here`);
    if (!interaction.isButton()) {
        return;
    }


    const member = interaction.member;
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
            await interaction.reply({
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
        await interaction.reply({
            content: "It is not your turn.",
            ephemeral: true,
        });
        return;
    }

    gameObj.board[gameIdxy[1]][gameIdxy[2]] = gameObj.turnOf;
    if (gameObj.getGameOver) {
        await interaction.update({
            content: `<@${gameObj.players[gameObj.turnOf]}> wins`,
            components: gameToButtons(gameObj, gameIdxy[0]),
        });
        delete gamesAlive[gameIdxy[0]];
        return;
    } else if (--gameObj.movesLeft == 0) {
        await interaction.update({
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

    await interaction.update({
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
