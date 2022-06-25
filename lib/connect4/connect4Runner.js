const { connect4GameObj } = require('./connect4Game');

const maxNumGames = 1000;
const symbols = ['⬛','🔴','🟡'];
const keycapEmojis = {
    '1️⃣': 0,
    '2️⃣': 1,
    '3️⃣': 2,
    '4️⃣': 3,
    '5️⃣': 4,
    '6️⃣': 5,
    '7️⃣': 6,
    '8️⃣': 7,
    '9️⃣': 8,
    '🔟': 9
};
const selfId = process.env.APP_ID
const playTimeMinutes = 120

var connect4GamesAlive = new Object();

// function createGameId() {
//     const dateObj = new Date();
//     return dateObj.getTime().toString();
// }

function c4BoardToString(C4Game) {
    var boardRepr = "";
    for (let i = 0; i < C4Game.width; i++) {
        boardRepr += Object.keys(keycapEmojis)[i] + " ";
    }
    boardRepr += '\n';
    C4Game.board.forEach((boardRow) => {
        boardRow.forEach((el) => {
            // boardRepr += el + ' '; // for plaintext
            boardRepr += symbols[el + 1] + ' ';
        })
        boardRepr += '\n';
    })
    return boardRepr;
}

async function createConnect4(interaction) {
    if (!interaction.isCommand()) return;

    const newC4 = new connect4GameObj();

    // limit on number of games; delete oldest game
    if (Object.keys(connect4GamesAlive).length >= maxNumGames) {
        delete connect4GamesAlive[Object.keys(connect4GamesAlive)[0]];
    }

    const gameMsg = await interaction.reply({
        content: "waiting for player 1\n" + c4BoardToString(newC4),
        fetchReply: true
    });

    connect4GamesAlive[gameMsg.id] = newC4;
    
    // create a collector on reacts
    const filter = (r, u) => {return true}
    const collector = gameMsg.createReactionCollector({ filter, time: playTimeMinutes * 60000 });

    
    collector.on('collect', (reaction, user) => {
        handleConnect4React(reaction, user)
    });

    // create initial reacts for game controls
    for (let i = 0; i < newC4.width; i++) {
        await gameMsg.react(Object.keys(keycapEmojis)[i]);
    }

}

async function handleConnect4React(reaction, user) {
    if (user.id == selfId) return;
    // When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

    const gameObj = connect4GamesAlive[reaction.message.id];

    var gameMessage = "";

    // game was over from before
    if (gameObj.gameWon) {
        gameMessage = "game already finished"
    } 
    // column is full
    else if (gameObj.insertInCol(keycapEmojis[reaction.emoji.name])) {
        gameMessage = "invalid move!";
    } 
    
    // move wins the game
    else if (gameObj.gameWon) {
        gameMessage = `\nGame over! <@${user.id}> wins.`
    } 
    
    else if (gameObj.movesLeft == 0) {
        gameMessage = "\nDraw!";
    } 
    
    else {
    }
    
    reaction.message.edit({
        content: c4BoardToString(gameObj) + "\n" + gameMessage
    });

    reaction.users.remove(user.id);

}

module.exports = {  
    createConnect4,
    handleConnect4React
}