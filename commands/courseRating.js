const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageAttachment } = require("discord.js");
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const puppeteer = require('puppeteer');

async function extractRating(url) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-accelerated-2d-canvas',
            '--disable-software-rasterizer'
        ]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const courseTitle = await page.$eval('h2.text-3xl.font-bold.break-words', el => el.textContent);
    const numReviews = await page.$eval('.space-x-2 > span', el => el.textContent);
    const ratings = await page.$$eval('.flex.flex-wrap.justify-around > div', items => {
        const result = [];
        items.slice(0, 3).forEach(el => {
            const rating = el.querySelector('.text-2xl.font-bold').textContent;
            const category = el.querySelector('.text-center.font-bold').textContent;
            result.push({
                name: category,
                value: `${rating} out of 5`,
                inline: true,
            });
        });
        return result;
    });

    const fullDescription = await page.$eval('.whitespace-pre-line', el => el.textContent);
    const description = fullDescription.split(/(?<=[.!?])\s/)[0].trim();

    await browser.close();
    return { courseTitle, numReviews, description, ratings };
}

function ratingColour(rating) {
    if (rating >= 3.5) {
        return '#39e75f'
    } else if (rating > 2.5) {
        return '#FFA500'
    }
    return '#FF0000'
}

async function buildChart(ratings) {
    const width = 800;
    const height = 300;
    const averageRating = ratings.reduce((sum, rating) => {
        return sum + parseFloat(rating.value.split(' ')[0]);
    }, 0) / ratings.length;

    const canvas = new ChartJSNodeCanvas({ width, height });

    const config = {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [averageRating, 5 - averageRating],
                backgroundColor: [ratingColour(averageRating), '#e0e0e0'],
                borderJoinStyle: 'round',
                borderRadius: [{
                    outerStart: 20,
                    innerStart: 20,
                }, {
                    outerEnd: 20,
                    innerEnd: 20,
                }],
                borderWidth: 0,
            }]
        },
        options: {
            rotation: 290,
            circumference: 140,
            cutout: '88%',
            plugins: {
                legend: {
                    display: false
                },
            }
        }
    };

    const image = await canvas.renderToBuffer(config);
    return image;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("courserating")
        .setDescription("Tells you the current rating of a specific course!")
        .addStringOption(option => (
            option.setName('course'))
            .setDescription('Enter the course code')
            .setRequired(true)),
    async execute(interaction) {
        const course = interaction.options.getString('course');

        const url = `https://unilectives.devsoc.app/course/${course}`;

        let year = new Date().getFullYear();
        const handbookUrl = `https://www.handbook.unsw.edu.au/undergraduate/courses/${year}/${course}`;

        try {
            await interaction.deferReply({ ephemeral: true });

            const { courseTitle, numReviews, description, ratings } = await extractRating(url);

            if (numReviews == "0 reviews") {
                await interaction.editReply({ content: "Sorry there are no reviews for this course yet 😔" });
                return;
            }

            const image = await buildChart(ratings);
            const attachment = new MessageAttachment(image, 'rating.png');
            ratings.unshift({
                name: '\u200B',
                value: `[${course} Handbook](${handbookUrl})`,
            });
            const replyEmbed = new MessageEmbed()
                .setColor(0x0099FF)
                .setTitle(course + ' ' + courseTitle)
                .setURL(url)
                .setDescription(description)
                .setImage('attachment://rating.png')
                .addFields(...ratings)
                .setFooter(numReviews);

            await interaction.editReply({ embeds: [replyEmbed], files: [attachment] });
        } catch (err) {
            console.log(err);
            await interaction.editReply({
                content: `Sorry the course could not be found! 😔`,
            });
        }
    }
};
