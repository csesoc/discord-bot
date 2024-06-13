const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageAttachment } = require("discord.js");

// Depends on ChartJS must be version 3.x.x (legacy version)
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');


const axios = require("axios");
const cheerio = require("cheerio");

function extractRating($) {
    const courseTitle = $('h2.text-3xl.font-bold.break-words').first().text();
    const items = $('.flex.flex-wrap.justify-around > div');
    const numReviews = $('.space-x-2 > span').first().text();
    const ratings = [];
    items.each((index, el) => {
        if (index >= 3) {
            return false;
        }
        const rating = $(el).find('.text-2xl.font-bold').text();
        const category = $(el).find('.text-center.font-bold').text();

        ratings.push({
            name: category,
            value: `${rating} out of 5`,
            inline: true, 
        })
    });

    const fullDescription = $('.whitespace-pre-line').first().text();
    const description = fullDescription.split(/(?<=[.!?])\s/)[0].trim();

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

    const canvas = new ChartJSNodeCanvas({width, height});

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
            .setRequired((true)),
        ),
    async execute(interaction) {
        const course = interaction.options.getString('course');

        // URL of the relevant course
        const url = `https://unilectives.devsoc.app/course/${course}`;

        // URL of the relevant handbook
        let year = new Date().getFullYear();
        const handbookUrl = `https://www.handbook.unsw.edu.au/undergraduate/courses/${year}/${course}`

        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const { courseTitle, numReviews, description, ratings } 
                = extractRating($);
            
            if (numReviews == "0 reviews") {
                await interaction.reply({ content: "Sorry there are no reviews for this course yet 😔", ephemeral: true });
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
            
            await interaction.reply({ embeds: [replyEmbed], files: [attachment]});
        } catch(err) {
            console.log(err);
            interaction.reply({
                content: `Sorry the course could not be found! 😔`,
                ephemeral: true,
            });
        }
    }
}