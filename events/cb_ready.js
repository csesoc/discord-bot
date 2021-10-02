const { CarrotboardStorage } = require("../lib/carrotboard");

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        global.cbStorage = new CarrotboardStorage(client);
    },
};

