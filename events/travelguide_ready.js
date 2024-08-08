// @ts-check
const { DBTravelguide } = require("../lib/database/dbtravelguide");

module.exports = {
    name: "ready",
    once: true,
    async execute() {
        const travelguideStorage = new DBTravelguide();
        global.travelguideStorage = travelguideStorage;
    },
};
