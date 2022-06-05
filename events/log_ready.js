const { DBlog } = require("../lib/database/dblog");

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        const logDB = new DBlog();
        global.logDB = logDB;
    },
};