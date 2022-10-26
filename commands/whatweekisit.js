// WhatWeekIsIt.js
// Written by Alexander Ziqi Chen CSESoc Projects 22T3 Discord Bot Team on 5/10/2022.
// Command that returns the current trimester week during the 10 teaching weeks per regular trimester.
// REQUIRES: npm i axios cheerio pretty
// cheerio is the WebScraper dependency.
// MAJOR WARNINGS:
// - THIS COMMAND HAS STATICALLY-CODED MONTHS, WHICH ASSUME:
//    - TERM 1 STARTS IN FEBRUARY
//    - TERM 2 STARTS IN MAY
//    - TERM 3 STARTS IN SEPTEMBER
//    THIS MAY CHANGE FROM YEAR TO YEAR SO CHECK:
//    https://www.student.unsw.edu.au/calendar
//
// - NOT CONFIGURED FOR LEAP YEARS, I.E. FEBRUARY IS ASSUMED TO BE 28 DAYS LONG.
// 
// tutorial:
// https://www.freecodecamp.org/news/how-to-scrape-websites-with-node-js-and-cheerio/

const { SlashCommandBuilder } = require("@discordjs/builders");

const axios = require("axios");
const cheerio = require("cheerio");
const pretty = require("pretty");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("whatweekisit")
        .setDescription("Tells you what week of the trimester it is!"),



    async execute(interaction) {
        // Statically coded stuff:
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var c_date = new Date();
        var c_day = c_date.getDate();
        //const c_date_string = `${c_date}`;
        let c_month = months[c_date.getMonth()];

        //console.log(c_month);
        //console.log(c_date);
        //console.log(c_date.getDate());

        var term = 999;

        var termStartDate = "";
        var termStartMonth = "";
        var termStartDay = -1;

        var week = 999;

        var match_c_date = 0;
        var is_teaching_term = 1;

        // URL of the page we want to scrape
        const url = "https://www.student.unsw.edu.au/calendar";

        try {
            // Fetch HTML of the page we want to scrape
            const { data } = await axios.get(url);
            // Load HTML we fetched in the previous line
            const $ = cheerio.load(data);
            // Select all the list items in plainlist class
            const listItems = $(".table-striped tbody tr");
            // Stores data for all datas
            const datas = [];
            const trimesters = [];
        
            // Use .each method to loop through the li we selected
            listItems.each((idx, el) => {
                // Object holding data for each data_const/jurisdiction
                const data_const = { name: "", term: "", altTerm: "" };
                // Select the text content of a and span elements
                // Store the textcontent in the above object
                data_const.name = $(el).children("td").text();
                data_const.term = $(el).children("td").children("a").text();
                data_const.altTerm = $(el).children("td").children("strong").children("a").text();
                // Populate datas array with data_const data
                datas.push(data_const);
           
            });


            //console.log("===============================================================");
            for (let index = 0; match_c_date != 1; index++) {
                //console.log(`Start Date`);
                //console.log(`${datas[index].name}`);  
                if (datas[index].name.substring(0, 18) === "Teaching period T1") {
                    //console.log("=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=1=");
                    if (datas[index].name.substring(18, 19) === "A") {
                
                    } else if (datas[index].name.substring(18, 19) === "B") {
                
                    } else if (datas[index].name.substring(18, 19) === "C") {
                
                    } else {
                        //console.log("0000000000000000000000000000000000000000000000000000000000000000000");
                        termStartDate = datas[index].name.substring(18, 24);
                        termStartDay = parseInt(datas[index].name.substring(18, 20));
                        termStartMonth = datas[index].name.substring(21, 24);
                        // e.g. "14 Feb"
                        //console.log(termStartDate);
                        //console.log(termStartDay);
                        //console.log(termStartMonth);
                    }

                    if (c_month == "Apr" && c_day < 22) {
                        week = (c_day + 31 + (28 - termStartDay)) / 7;
                        match_c_date = 1;
                        term = 1;
                        is_teaching_term = 1;
                    } else if (c_month == "Mar") {
                        week = (c_day + (28 - termStartDay)) / 7;
                        match_c_date = 1;
                        term = 1;
                        is_teaching_term = 1;
                    } else if (c_month == "Feb") {
                        if ((c_day - termStartDay) >= 0) {
                            week = (c_day - termStartDay) / 7;
                            //week = week.Math.ceil();
                            //console.log(`THE TERM 1 WEEK IS: ${week}`);
                            match_c_date = 1;
                            term = 1;
                            is_teaching_term = 1;
                        }
                    } else {
                        is_teaching_term = 0;
                    }
                    
                } else if (datas[index].name.substring(0, 18) === "Teaching period T2") {
                    //console.log("===============================================================");
                    if (datas[index].name.substring(18, 19) === "A") {
                    
                    } else if (datas[index].name.substring(18, 19) === "B") {
                    
                    } else if (datas[index].name.substring(18, 19) === "C") {
                    
                    } else {
                        //console.log("0000000000000000000000000000000000000000000000000000000000000000000");
                        termStartDate = datas[index].name.substring(18, 24);
                        termStartDay = parseInt(datas[index].name.substring(18, 20));
                        termStartMonth = datas[index].name.substring(21, 24);
                        // e.g. "30 May"
                        //console.log(termStartDate);
                        //console.log(termStartDay);
                        //console.log(termStartMonth);
                    }

                    if (c_month == "Aug" && c_day < 5) {
                        week = (c_day + 31 + 30 + (31 - termStartDay)) / 7;
                        match_c_date = 1;
                        term = 2;
                        is_teaching_term = 1;
                    } else if (c_month == "Jul") {
                        week = (c_day + 30 + (31 - termStartDay)) / 7;
                        match_c_date = 1;
                        term = 2;
                        is_teaching_term = 1;
                    } else if (c_month == "Jun") {
                        week = (c_day + (31 - termStartDay)) / 7;
                        match_c_date = 1;
                        term = 2;
                        is_teaching_term = 1;
                    } else if (c_month == "May") {
                        if ((c_day - termStartDay) >= 0) {
                            week = (c_day - termStartDay) / 7;
                            //week = week.Math.ceil();
                            //console.log(`THE TERM 2 WEEK IS: ${week}`);
                            match_c_date = 1;
                            term = 2;
                            is_teaching_term = 1;
                        }
                    } else {
                        is_teaching_term = 0;
                    }
                    
                } else if (datas[index].name.substring(0, 18) === "Teaching period T3") {
                    //console.log("===============================================================");
                    if (datas[index].name.substring(18, 19) === "A") {
                
                    } else if (datas[index].name.substring(18, 19) === "B") {
                
                    } else if (datas[index].name.substring(18, 19) === "C") {
                
                    } else {
                        //console.log("0000000000000000000000000000000000000000000000000000000000000000000");
                        termStartDate = datas[index].name.substring(18, 24);
                        termStartDay = parseInt(datas[index].name.substring(18, 20));
                        termStartMonth = datas[index].name.substring(21, 24);
                        // e.g. "30 May"
                        //console.log(termStartDate);
                        //console.log(termStartDay);
                        //console.log(termStartMonth);
                    }

                    if (c_month == "Nov" && c_day < 20) {
                        week = (c_day + 31 + (30 - termStartDay)) / 7;
                        match_c_date = 1;
                        term = 3;
                        is_teaching_term = 1;
                    } else if (c_month == "Oct") {
                        week = (c_day + (30 - termStartDay)) / 7;
                        match_c_date = 1;
                        term = 3;
                        is_teaching_term = 1;
                    } else if (c_month == "Sep") {
                        if ((c_day - termStartDay) >= 0) {
                            week = (c_day - termStartDay) / 7;
                            //week = week.Math.ceil();
                            //console.log(`THE TERM 3 WEEK IS: ${week}`);
                            match_c_date = 1;
                            term = 3;
                            is_teaching_term = 1;
                        }
                    } else {
                        is_teaching_term = 0;
                    }
                }
            }

            // because [(any day during week 1) / 7 ] < 1
            week = week + 1;
            // e.g. round week 6.456345 to just week 6.
            week = Math.floor(week);

            //console.log("- - - - - - - - - - - - - ");
            //console.log("- - - - - - - - - - - - - ");
            //console.log(`IT IS WEEK ${week}`);
            //console.log("- - - - - - - - - - - - - ");
            //console.log("- - - - - - - - - - - - - ");

        } catch (err) {
            console.error(err);
        }
        if (is_teaching_term == 1) {
            await interaction.reply(`It is term ${term}, week ${week}!\n`);
        } else {
            await interaction.reply(`It is not currently a trimester teaching period!\n`);
        }
        
    },
};