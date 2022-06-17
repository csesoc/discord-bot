const { handleConnect4React } = require("../lib/connect4/connect4Runner");

module.exports = {
    once: false,
    name: "messageReactionAdd",
    execute(reaction, user) {
        handleConnect4React(reaction, user);
    }
}