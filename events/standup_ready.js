const { DBstandup} = require("../lib/database/dbstandup");

module.exports = {
    name: "ready",
    once: true,
    execute() {
        const standupDBGlobal = new DBstandup();
        global.standupDBGlobal = standupDBGlobal;
    },
};