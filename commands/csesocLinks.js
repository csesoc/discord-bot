const { SlashCommandBuilder } = require("@discordjs/builders");
const cheerio = require("cheerio");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("csesoclinks")
        .setDescription("Provides CSESoc Linktree links."),
    async execute(interaction) {
        fetch("https://linktr.ee/csesoc")
            .then((res) => {
                return res.text();
            })
            .then((html) => {
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
                interaction.reply({
                  content: output,
                });
            })
            .catch((err) => {
                console.log("Failed to fetch page: ", err);
            });
    },
};
