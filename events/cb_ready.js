const { CarrotboardStorage } = require("../lib/carrotboard");

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        const cbStorage = new CarrotboardStorage(client);
        global.cbStorage = cbStorage;
    },
};

