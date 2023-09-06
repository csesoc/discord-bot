// @ts-check
import { DBFaq } from "../lib/database/faq";
/* eslint-disable */

export default {
    name: "ready",
    once: true,
    async execute() {
        const faqStorage = new DBFaq();
        (global as any).faqStorage = faqStorage;
    },
};

