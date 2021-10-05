//@ts-check

const { SlashCommandBuilder } = require("@discordjs/builders");
const fetch = require("node-fetch");

async function handle(interaction) {
    const endpoint = "https://handbook.insou.dev/api/v1/course/";
    const course = "comp1511";

    const res = await fetch(endpoint + course);
    const data = await res.json();

    console.log(data);
    interaction.reply(JSON.stringify(data));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),

    async execute(interaction) {
        await handle(interaction);
    },
};
