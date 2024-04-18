const { SlashCommandBuilder } = require("@discordjs/builders");
const cheerio = require("cheerio");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("csesoclinks")
        .setDescription("Provides all CSESoc related links."),
    async execute(interaction) {
        fetch("https://linktr.ee/csesoc")
            .then(function (response) {
                return response.text();
            })
            .then(function (html) {
                const $ = cheerio.load(html);
                const links = $("a");
                let output = "";
                links.each((index, value) => {
                    const title = $(value).text().trim();
                    const href = $(value).attr("href");
                    if (href && href !== "#" && !title.includes("Linktree")) {
                        output += `${title}: ${href}\n`;
                    }
                });
                console.log(output);

                interaction.reply({
                    content: output,
                    // ephemeral: true,
                });
            })
            .catch(function (err) {
                console.log("Failed to fetch page: ", err);
            });
    },
};
