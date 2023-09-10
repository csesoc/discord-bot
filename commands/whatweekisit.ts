// @ts-check
// WhatWeekIsIt.js
// Written by Alexander Ziqi Chen CSESoc Projects 22T3 Discord Bot Team on 5/10/2022.
// Command that returns the current trimester week during the 10 teaching weeks per regular trimester.
// REQUIRES: npm i axios cheerio pretty
// cheerio is the WebScraper dependency.
// MAJOR WARNINGS:
// - THIS COMMAND HAS STATICALLY-CODED MONTHS, WHICH ASSUME:
//    - CURRENT YEAR IS ALWAYS THE SECOND COLUMN OF THE WEBSITE
//    - TERMS ALWAYS START ON A MONDAY
//    - TEACHING PERIOD + STUDY PERIOD + EXAMS INCLUDE ALL THE DAYS IN A TERM
//    - SHUTDOWN PERIOD OCCURS AT THE END OF THE YEAR INTO THE FOLLOWING YEAR
//    THIS MAY CHANGE FROM YEAR TO YEAR SO CHECK:
//    https://www.student.unsw.edu.au/calendar
//
//
// tutorial:
// https://www.freecodecamp.org/news/how-to-scrape-websites-with-node-js-and-cheerio/

import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

const axios = require("axios").default;
import cheerio from "cheerio";

/**
 * 
 * @param {string[]} date_string 
 * @param {Date} c_date 
 * @param {string[]} months 
 * @returns {boolean}
 */
function checkInBetween(date_string: string[], c_date: Date, months: string[]): boolean {
    const beginning_date = date_string[0];
    const beginning_month = months.indexOf(date_string[1]!);
    let ending_date = date_string[3];
    let ending_month = months.indexOf(date_string[4]!);
    if (date_string.length > 5) {
        ending_month = months.indexOf(date_string[5]!);
        ending_date = date_string[4];

        if (c_date.getFullYear().toString() == date_string[2]) {
            if (beginning_month <= c_date.getMonth() && Number(beginning_date) <= c_date.getDate()) {
                return true;
            }
        } else if (c_date.getFullYear().toString() == date_string[6]) {
            if (ending_month <= c_date.getMonth() && Number(ending_date) >= c_date.getDate()) {
                return true;
            }
        }

        return false;
    }

    if (beginning_month <= c_date.getMonth() && ending_month >= c_date.getMonth()) {
        if (beginning_month == c_date.getMonth() && Number(beginning_date) > c_date.getDate()) {
            return false;
        } else if (ending_month == c_date.getMonth() && Number(ending_date) < c_date.getDate()) {
            return false;
        } else {
            return true;
        }
    }

    return false;
}

/**
 * 
 * @param {string[]} date_string 
 * @param {Date} c_date 
 * @param {string[]} months 
 * @returns {number}
 */
function whatweek(date_string: string[], c_date: Date, months: string[]): number {
    const beginning_date = date_string[0];
    const beginning_month = months.indexOf(date_string[1]!);

    const date_begin = new Date(c_date.getFullYear(), beginning_month, Number(beginning_date), 0, 0, 0);

    // To calculate the time difference of two dates
    const Difference_In_Time = c_date.getTime() - date_begin.getTime();

    // To calculate the no. of days between two dates
    const Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

    // console.log(Math.ceil(Difference_In_Days/7))
    return Math.ceil(Difference_In_Days / 7);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("whatweekisit")
        .setDescription("Tells you what week of the trimester it is!"),

    /**
     *
     * @async
     * @param {ChatInputCommandInteraction} interaction
     * @returns
     */
    async execute(interaction: ChatInputCommandInteraction) {
        // Statically coded stuff:
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        const c_date = new Date();

        let week = 0;

        let match_c_date = 0;

        // URL of the page we want to scrape
        const url = "https://www.student.unsw.edu.au/calendar";

        try {
            // Fetch HTML of the page we want to scrape
            const { data } = await axios.get(url);
            // Load HTML we fetched in the previous line
            const $ = cheerio.load(data);
            // Select all the list items in plainlist class
            const listItems = $(".table-striped tbody tr");

            interface TermInfo {
                period: string;
                term: string;
            }

            const datas: TermInfo[] = [];

            // Use .each method to loop through the li we selected
            listItems.each((_, el) => {
                // Object holding data for each data_const/jurisdiction
                /**
                 * @type {TermInfo}
                 */
                const data_const: TermInfo = { period: "", term: "" };
                // Select the text content of a and span elements
                // Store the textcontent in the above object
                data_const.period = $(el).children("td:nth-child(2)").text();
                data_const.term = $(el).children("td:nth-child(1)").text();

                // console.log($(el).children("td:nth-child(2)").text() + "\n");
                // Populate datas array with data_const data
                datas.push(data_const);
            });

            // console.log(datas)

            for (let index = 0; match_c_date != 1 && index < datas.length; index++) {
                const date_string = datas[index]!.period.split(/\s/g);
                // console.log(date_string)

                if (datas[index]!.term == "UNSW Shutdown") {
                    if (checkInBetween(date_string, c_date, months)) {
                        console.log("UNSW Shutdown Period");
                    }
                } else if (datas[index]!.term == "Teaching period U1") {
                    if (checkInBetween(date_string, c_date, months)) {
                        week = whatweek(date_string, c_date, months);
                        interaction.reply(`It is Summer Term, Week ${week}`);
                        match_c_date = 1;
                        return;
                    }
                } else if (datas[index]!.term == "Teaching period T1") {
                    if (checkInBetween(date_string, c_date, months)) {
                        week = whatweek(date_string, c_date, months);
                        if (week == 6) {
                            console.log("It is Term 1, Flex Week (6)");
                        }
                        interaction.reply(`It is Term 1, Week ${week}`);
                        match_c_date = 1;
                        return;
                    }
                } else if (datas[index]!.term == "Teaching period T2") {
                    if (checkInBetween(date_string, c_date, months)) {
                        week = whatweek(date_string, c_date, months);
                        if (week == 6) {
                            console.log("It is Term 2, Flex Week (6)");
                        }
                        interaction.reply(`It is Term 2, Week ${week}`);
                        match_c_date = 1;
                        return;
                    }
                } else if (datas[index]!.term == "Teaching period T3") {
                    if (checkInBetween(date_string, c_date, months)) {
                        week = whatweek(date_string, c_date, months);
                        if (week == 6) {
                            console.log("It is Term 3, Flex Week (6)");
                        }
                        interaction.reply(`It is Term 3, Week ${week}`);
                        match_c_date = 1;
                        return;
                    }
                } else if (datas[index]!.term.includes("Study period")) {
                    if (checkInBetween(date_string, c_date, months)) {
                        const data_p = datas[index]!.term;
                        const t = data_p.replace("Study period", "");
                        interaction.reply(`It is Study Period${t}`);
                        match_c_date = 1;
                        return;
                    }
                } else if (datas[index]!.term.includes("Exams")) {
                    if (checkInBetween(date_string, c_date, months)) {
                        const data_p = datas[index]!.term;
                        const t = data_p.replace("Exams", "");
                        interaction.reply(`It is Exam Period${t}`);
                        match_c_date = 1;
                        return;
                    }
                } else if (datas[index]!.term.includes("Term break")) {
                    if (checkInBetween(date_string, c_date, months)) {
                        interaction.reply("It is Term Break.");
                        match_c_date = 1;
                        return;
                    }
                }
            }

            if (match_c_date != 1) {
                interaction.reply("Not a teaching period.");
            }
        } catch (err) {
            console.error(err);
        }
    },
};