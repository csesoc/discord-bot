const { handleGameButton } = require("../lib/tictactoe/ttcHelper");

module.exports = {
    once: false,
    name: "interactionCreate",
    execute(interaction) {
        if (!interaction.isButton()) return;
        handleGameButton(interaction);
    }
}