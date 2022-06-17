const { handleGameButton } = require("../lib/tictactoe/tttHelper");

module.exports = {
    once: false,
    name: "interactionCreate",
    execute(interaction) {
        if (!interaction.isButton()) return;
        handleGameButton(interaction);
    }
}