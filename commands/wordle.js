/* eslint-disable no-unused-vars */
const { SlashCommandBuilder } = require("@discordjs/builders");
const { wordOfTheDay, timeChanged, words } = require("../config/words.json");
const { players } = require("../config/wordle.json");
const fs = require("fs");
const Canvas = require("canvas");

// Letter class
// Because OOP is always a good idea
class Letter {
    constructor(letter, pos, color = 1) {
        this.letter = letter;
        this.pos = pos;
        this.color = color;
    }
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName("wordle")
        .setDescription("Play a wordle game!")
        .addSubcommand(subcommand => subcommand
            .setName("play")
            .setDescription("Picks a new word if not selected, starts a new game."),

        )
        .addSubcommand(subcommand => subcommand
            .setName("guess")
            .setDescription("Guess a word.")
            .addStringOption(option => option
                .setName("word")
                .setDescription("The word to guess.")
                .setRequired(true),
            ),
        ),
    async execute(interaction) {

        const userID = interaction.user.id;
        // check if userID exists in players value
        let player = undefined;

        for (let i = 0; i < players.length; i++) {
            if (players[i].id === userID) {
                player = players[i];
            }
        }

        if (player === undefined) {
            // New user
            // add user to players
            console.log("New user");
            const word = words[Math.floor(Math.random() * words.length)];
            const NewPlayer = {
                id: userID,
                name: interaction.user.username,
                wordOfTheDay: word,
                timeChanged: Date.now(),
                if_finished: false,
                words: [word],
                guesses: [],
                score: 0,
                total_games: 0,
            };
            // add userID: NewPlayer to players
            player = NewPlayer;
            players.push(player);
            fs.writeFileSync("./config/wordle.json", JSON.stringify({ players }, null, 4));
        } else {
            // user exists
            console.log("user exists");
            const timeDiff = Math.abs(new Date() - new Date(player.timeChanged));
            // If day has changed, select new word and reset game state
            if (timeDiff > 86400000 || player.wordOfTheDay === "" || player.wordOfTheDay === undefined) {
                console.log("Picking a new word");
                player.wordOfTheDay = words[Math.floor(Math.random() * words.length)];
                player.timeChanged = Date.now();
                player.if_finished = false;
                player.words.push(player.wordOfTheDay);
                player.guesses = [];
            }
            fs.writeFileSync("./config/wordle.json", JSON.stringify({ players }, null, 4));
        }

        const selectedWord = player.wordOfTheDay;
        // if timeChanged is more than a day ago, pick a new word
        console.log("Selected Word: " + selectedWord);
        const setWin = () => {
            player.if_finished = true;
            player.total_games++;
            player.score++;
            const editedPlayers = players;
            fs.writeFileSync("./config/wordle.json", JSON.stringify({ players: editedPlayers }, null, 4));
        };
        const setLoss = () => {
            player.if_finished = true;
            player.total_games++;
            const editedPlayers = players;
            fs.writeFileSync("./config/wordle.json", JSON.stringify({ players: editedPlayers }, null, 4));
        };
        // function to returns every unique letter in a string with count of each letter
        const eachLetterCount = (answer) => {
            const letters = answer.split("");
            const letterCount = {};
            letters.forEach(letter => {
                if (letterCount[letter]) {
                    letterCount[letter]++;
                } else {
                    letterCount[letter] = 1;
                }
            });
            return letterCount;
        };
        const GetImage = (guessLetter, answerLetter, i, answerCount, guessCount, greenCount, yellowCount) => {

            // letter is undefined
            if (guessLetter === undefined) {
                return 0;
            } else if (guessLetter.charAt(i) == answerLetter.charAt(i)) {
                // letter is correct
                greenCount[guessLetter.charAt(i)]++;
                return 2;
            // letter is in word at same spot
            } else if (answerLetter.includes(guessLetter.charAt(i))) {
                const total_count = greenCount[guessLetter.charAt(i)] + yellowCount[guessLetter.charAt(i)];
                if (total_count < answerCount[guessLetter.charAt(i)]) {
                    yellowCount[guessLetter.charAt(i)]++;
                    return 3;
                } else {
                    return 1;
                }
            // letter is in word at different spot
            } else {
                return 1;
            }
            // letter is not in word
        };
        const getAnswer = (answer, guess) => {
            console.log("Answer: " + answer);
            console.log("Guess: " + guess);
            const answerCount = eachLetterCount(answer);
            const colors = [];
            const greenCount = {};
            const yellowCount = {};
            for (let i = 0; i < answer.length; i++) {
                colors[i] = 0;
                greenCount[answer.charAt(i)] = 0;
                yellowCount[answer.charAt(i)] = 0;
            }
            if (guess === undefined) {
                // return array of 6 0s
                return colors;
            }
            // Check for exact matches in position
            for (let i = 0; i < answer.length; i++) {
                if (guess.charAt(i) == answer.charAt(i)) {
                    colors[i] = 2;
                    console.log("\t green count of " + answer.charAt(i) + ": " + greenCount[answer.charAt(i)]);
                    greenCount[answer.charAt(i)]++;
                    console.log("\t green count: " + greenCount[answer.charAt(i)]);
                }
            }
            // Check for matches in word
            for (let i = 0; i < answer.length; i++) {
                console.log("\t answer letter: " + answer.charAt(i));


                const maxCount = answerCount[answer.charAt(i)] - greenCount[answer.charAt(i)];
                console.log("\t maxCount: " + maxCount);
                console.log(guess.includes(answer.charAt(i)));
                if (guess.includes(answer.charAt(i))) {
                    console.log(greenCount);
                    console.log(yellowCount);
                    console.log(answerCount);
                    console.log("Max Count for " + answer.charAt(i) + ": " + maxCount);
                    console.log("answer[charAt(i)]: " + answer.charAt(i));
                    if (maxCount > 0) {
                        console.log("Adding yellow");
                        console.log("answerCount[answer.charAt(i)], i: " + answerCount[answer.charAt(i)] + ", " + i);
                        console.log("greenCount[answer.charAt(i)], i: " + greenCount[answer.charAt(i)] + ", " + i);
                        yellowCount[answer.charAt(i)]++;
                        colors[i] = 3;
                    }
                }
            }
            
            // make all other letters 1
            for (let i = 0; i < answer.length; i++) {
                if (colors[i] < 1) {
                    colors[i] = 1;
                }
            }
            return colors;
        };


        async function LoadGame(msg, guesses, answer) {
            // make a blank canvas
            const canvas = Canvas.createCanvas(330, 397);
            const context = canvas.getContext("2d");

            const background = await Canvas.loadImage("config/wordle_images/blank_box.png");
            context.drawImage(background, 0, 0, canvas.width, canvas.height);

            context.font = "42px Clear Sans, Helvetica Neue, Arial, sans-serif";
            context.textAlign = "center";
            context.fillStyle = "#d7dadc";

            const absentSquare = await Canvas.loadImage("config/wordle_images/empty_box.png");
            const emptySquare = await Canvas.loadImage("config/wordle_images/grey_box.png");
            const greenSquare = await Canvas.loadImage("config/wordle_images/green_box.png");
            const yellowSquare = await Canvas.loadImage("config/wordle_images/yellow_box.png");
            const square_arr = [absentSquare, emptySquare, greenSquare, yellowSquare];
            let square = emptySquare;

            const squareSize = 62;
            let rowOffset = 0;
            let buffer = 0;


            for (let j = 0; j < 6; j++) {
                const imageNums = getAnswer(answer, guesses[j]);
                for (let i = 0; i < 5; i++) {
                    // eslint-disable-next-line no-undef
                    const imageNumber = imageNums[i];
                    square = square_arr[imageNumber];

                    context.drawImage(square, i * squareSize + buffer, rowOffset, squareSize, squareSize);
                    if (guesses[j] != undefined) {
                        context.fillText(guesses[j].charAt(i), (squareSize / 2) + buffer + squareSize * i, rowOffset + 42);
                    }
                    buffer += 5;
                }
                buffer = 0;
                rowOffset += squareSize + 5;
            }
            // return the canvas
            // console.log(msg);
            // if last guess is correct, send message
            const lastGuess = guesses[guesses.length - 1];
            if (player.if_finished) {
                msg.channel.send(`${player.name} has already finished the game! Come back tomorrow for a new word!`);
            } else {
                if (lastGuess === answer) {
                    msg.channel.send(`${player.name} you won! Come back tomorrow for a new word!`);
                    setWin();
                }
                // 6 guesses have been made, setLose
                if (guesses.length === 6) {
                    msg.channel.send(`${player.name} you lost!:frowning2: Try again tomorrow `);
                    setLoss();
                }
            }
            msg.reply({
                files: [{ attachment: canvas.toBuffer(), name: "wordle.png" }] });
            // msg.message.author.send({ files: [{ attachment: canvas.toBuffer(), name: "wordle.png" }] });
        }

        if (interaction.options.length === 0) {
            interaction.channel.send("Invalid Usage!\nUsage: `/wordle play`");
            return;
        } else if (interaction.options.getSubcommand() === "play") {

            this.guesses = player.guesses;
            // Start a new game
            console.log("Selected word (play): " + selectedWord);
            // console.log(interaction);
            LoadGame(interaction, player.guesses, player.wordOfTheDay);

        } else if (interaction.options.getSubcommand() === "guess") {
            // Guess a word
            // console.log("Guess: " + interaction.options.getString("word"));
            if (interaction.options.getString("word") === undefined) {
                interaction.channel.send("Invalid Usage!\nUsage: `/wordle guess <word>`");
                return;
            } else {
                if (this.guesses === undefined) {
                    this.guesses = player.guesses;
                }

                const guess = interaction.options.getString("word").toLowerCase();
                if (guess.length !== 5) {
                    interaction.channel.send("Invalid Usage!\nUsage: `/wordle guess <word>`");
                    return;
                } else {
                    if (!player.if_finished) {
                        console.log("Guess: " + guess);
                        console.log("guesses: " + this.guesses);
                        this.guesses.push(guess);
                        // update guesses in players
                        player.guesses = this.guesses;
                        const editedPlayers = players;
                        fs.writeFileSync("./config/wordle.json", JSON.stringify({ players: editedPlayers }, null, 4));
                    }
                    // update guesses in file
                    // console.log("gueess: " + this.guesses);
                    // console.log("player.guesses: " + player.guesses);
                    LoadGame(interaction, this.guesses, player.wordOfTheDay);
                }
            }
        }

    },
};
