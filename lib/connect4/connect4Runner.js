const { connect4GameObj } = require('./connect4Game');

const maxNumGames = 1000;
const symbols = ['⬛','🔴','🟡'];
const keycapEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

var connect4GamesAlive = new Object();

// function createGameId() {
//     const dateObj = new Date();
//     return dateObj.getTime().toString();
// }

function c4BoardToString(C4Game) {
    var boardRepr = "";
    C4Game.board.forEach((boardRow) => {
        boardRow.forEach((el) => {
            boardRepr += symbols[el + 1] + ' ';
        })
        boardRepr += '\n';
    })
    return boardRepr;
}

async function createConnect4(interaction) {
    if (!interaction.isCommand()) return;

    const newC4 = new connect4GameObj();
    // const newGameId = createGameId();

    // limit on number of games; delete oldest game
    if (Object.keys(connect4GamesAlive).length >= maxNumGames) {
        delete connect4GamesAlive[Object.keys(connect4GamesAlive)[0]];
    }

    const gameMsg = await interaction.reply({
        content: "waiting for player 1\n" + c4BoardToString(newC4),
        fetchReply: true
    });

    connect4GamesAlive[gameMsg.id] = newC4;
    
    for (let i = 0; i < newC4.width; i++) {
        await gameMsg.react(keycapEmojis[i]);
    }
}

async function handleConnect4React(reaction, user) {
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
    reaction.message.edit({
        content: c4BoardToString(connect4GamesAlive[reaction.message.id]) + "\n user is " + user.id + " "
    });
}

module.exports = {  
    createConnect4,
    handleConnect4React
}