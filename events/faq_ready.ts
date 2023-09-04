// @ts-check
import { DBFaq } from "../lib/database/faq";
/* eslint-disable */

export const ready = {
    name: "ready",
    once: true,
    async execute() {
        const faqStorage = new DBFaq();
        global.faqStorage = faqStorage;
    },
};

