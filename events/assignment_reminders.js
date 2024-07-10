const { EmbedBuilder, AttachmentBuilder } = require("discord.js");

const puppeteer = require("puppeteer");

async function extractDueDates(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const assessments = await page.$$eval('.dynamic-table.has-mobile-table', tables => {
        const table = tables[2]; // Select the third occurrence
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        return rows.map(row => {
            let assessmentItem = row.querySelector('td:first-child')?.innerText.trim();
            const weight = row.querySelector('td:nth-child(2)')?.innerText.trim();
            const dueDate = row.querySelector('dl.dynamic-table-dl div:nth-of-type(2) dd')?.innerText.trim();

            // Remove the trailing "Assessment FormatIndividual"
            if (assessmentItem) {
                assessmentItem = assessmentItem.replace(/Assessment Format\s*Individual$/, '').trim();
            }

            return { assessmentItem, weight, dueDate };
        });
    });

    await browser.close();
    return assessments;
}

function checkInBetween(date_string, c_date, months) {
    const beginning_date = date_string[0];
    const beginning_month = months.indexOf(date_string[1]);
    let ending_date = date_string[3];
    let ending_month = months.indexOf(date_string[4]);
    if (date_string.length > 5) {
        ending_month = months.indexOf(date_string[5]);
        ending_date = date_string[4];

        if (c_date.getFullYear() == date_string[2]) {
            if (beginning_month <= c_date.getMonth() && beginning_date <= c_date.getDate()) {
                return true;
            }
        } else if (c_date.getFullYear() == date_string[6]) {
            if (ending_month <= c_date.getMonth() && ending_date >= c_date.getDate()) {
                return true;
            }
        }

        return false;
    }

    if (beginning_month <= c_date.getMonth() && ending_month >= c_date.getMonth()) {
        if (beginning_month == c_date.getMonth() && beginning_date > c_date.getDate()) {
            return false;
        } else if (ending_month == c_date.getMonth() && ending_date < c_date.getDate()) {
            return false;
        } else {
            return true;
        }
    }

    return false;
}

async function getCurrentTerm() {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const c_date = new Date();
    const url = "https://www.student.unsw.edu.au/calendar";

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const listItems = $(".table-striped tbody tr");
        const datas = [];

        listItems.each((idx, el) => {
            const data_const = { period: "", term: "" };
            data_const.period = $(el).children("td:nth-child(2)").text();
            data_const.term = $(el).children("td:nth-child(1)").text();
            datas.push(data_const);
        });

        for (let index = 0; index < datas.length; index++) {
            const date_string = datas[index].period.split(/\s/g);

            if (datas[index].term === "Teaching period T1" && checkInBetween(date_string, c_date, months)) {
                return 1;
            } else if (datas[index].term === "Teaching period T2" && checkInBetween(date_string, c_date, months)) {
                return 2;
            } else if (datas[index].term === "Teaching period T3" && checkInBetween(date_string, c_date, months)) {
                return 3;
            }
        }

        return -1; // Return -1 if not in any teaching period
    } catch (err) {
        console.error(err);
        return -1;
    }
}

async function scheduleReminder() {
    const term = getCurrentTerm();
    const currentYear = new Date().getFullYear();
    const url = `https://www.unsw.edu.au/course-outlines/course-outline#year=${currentYear}&term=Term%20${term}&deliveryMode=In%20Person&deliveryFormat=Standard&
teachingPeriod=T${term}&deliveryLocation=Kensington&courseCode=${course}&activityGroupId=1`;

    extractDueDates(url);
}

