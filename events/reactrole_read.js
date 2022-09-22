const { DBReactRole } = require("../lib/database/dbreactrole");

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        const reactRoles = new DBReactRole();
        global.reactRoles = reactRoles;
    },
};
