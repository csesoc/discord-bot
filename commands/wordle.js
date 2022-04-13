/* eslint-disable no-unused-vars */
const { SlashCommandBuilder } = require("@discordjs/builders");
const { wordOfTheDay, words } = require("../config/words.json");
const fs = require("fs");
const Canvas = require("canvas");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("wordle")
        .setDescription("Play a wordle game!")
        .addSubcommand(subcommand => subcommand
            .setName("play")
            .setDescription("Picks a new word if not selected, starts a new game.")

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


        let selectedWord = wordOfTheDay;


        function getRandomWord() {
            return words[Math.floor(Math.random() * words.length)];
        }
        const GetImage = (guessLetter, answerLetter, i) => {
            // letter is in word at same spot
            if (guessLetter === undefined) {return 0;}
            // letter is in word at same spot
            else if (guessLetter.charAt(i) == answerLetter.charAt(i)) {return 1;}
            // letter is in word at different spot
            else if (answerLetter.includes(guessLetter.charAt(i))) {return 2;}
            // letter is not in word
            else {return 3;}
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
            const emptySquare = await Canvas.loadImage("config/wordle_images/clear_box.png");
            const greenSquare = await Canvas.loadImage("config/wordle_images/green_box.png");
            const yellowSquare = await Canvas.loadImage("config/wordle_images/yellow_box.png");
            const square_arr = [absentSquare, emptySquare, greenSquare, yellowSquare];
            let square = absentSquare;

            const squareSize = 62;
            let rowOffset = 0;
            let buffer = 0;

            for (let j = 0; j < 6; j++) {
                for (let i = 0; i < 5; i++) {
                    // eslint-disable-next-line no-undef
                    const imageNumber = GetImage(guesses[j], answer, i);
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
            msg.reply({ files: [{ attachment: canvas.toBuffer(), name: "wordle.png" }] });
        }


        if (interaction.options.length === 0) {
            interaction.channel.send("Invalid Usage!\nUsage: `/wordle play`");
            return;
        } else if (interaction.options.getSubcommand() === "play") {
            // Pick a new word if not selected
            if (this.selectedWord === "") {
                this.selectedWord = getRandomWord();
            }
            this.guesses = [];
            // Start a new game

            selectedWord = wordOfTheDay;


            console.log(interaction);
            LoadGame(interaction, "", "");

            // make a blank canvas

        }

    },
};
