const { DBReactRole } = require("../lib/database/dbreactrole");

module.exports = {
    name: "ready",
    once: true,
    async execute() {
        const reactRoles = new DBReactRole();
        global.reactRoles = reactRoles;
    },
};
