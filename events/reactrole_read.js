const { DBReactRole } = require("../lib/database/dbreactrole");
/* eslint-disable */

module.exports = {
    name: "ready",
    once: true,
    async execute() {
        const reactRoles = new DBReactRole();
        global.reactRoles = reactRoles;
    },
};
