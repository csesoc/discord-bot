// @ts-check
const { DBFaq } = require("../lib/database/faq");

module.exports = {
    name: "ready",
    once: true,
    async execute() {
        const faqStorage = new DBFaq();
        global.faqStorage = faqStorage;
    },
};
