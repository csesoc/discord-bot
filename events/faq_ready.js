//@ts-check
const { DBFaq } = require("../lib/database/faq");

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        const faqStorage = new DBFaq();
        global.faqStorage = faqStorage;
    },
};