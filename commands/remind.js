const { SlashCommandBuilder } = require("@discordjs/builders");
const { Embed } = require("@discordjs/builders");

const baseCommand = new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Be reminded at a certain time by the bot")
    .addStringOption((option) =>
        option
            .setName("datetime")
            .setDescription("Enter the time as YYYY-MM-DD HH:MM")
            .setRequired(true),
    )
    .addStringOption((option) =>
        option
            .setName("content")
            .setDescription("Enter what the reminder is for")
            .setRequired(true),
    );

module.exports = {
    data: baseCommand,

    async execute(interaction) {
        const datetime = interaction.options.getString("datetime");

        const re = /^\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;

        // Check if datetime is valid
        if (!re.test(datetime)) {
            return await interaction.reply({
                content: "Please enter the datetime as YYYY-MM-DD HH:MM exactly",
                ephemeral: true,
            });
        }

        const send_time = new Date(datetime);
        const today = new Date();
        const now_time = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            today.getHours(),
            today.getMinutes(),
            0,
        );

        const time_send_in = send_time - now_time;

        if (time_send_in <= 0) {
            return await interaction.reply({
                content: "Please enter a datetime in the future for 'datetime'",
                ephemeral: true,
            });
        }

        const iconUrl = "https://avatars.githubusercontent.com/u/164179?s=200&v=4";
        const botName = "CSESOCBOT";

        const reminderRequestEmbed = new Embed()
            .setColor(0xffe5b4)
            .setTitle("Reminder has been queued!")
            .setAuthor({ name: botName, iconURL: iconUrl })
            .addFields(
                { name: "Requested by", value: interaction.user.toString(), inline: true },
                {
                    name: "For the date",
                    value: "<t:" + send_time.getTime() / 1000 + ">",
                    inline: true,
                },
            )
            .setTimestamp();

        const reminderEmbed = new Embed()
            .setColor(0xffe5b4)
            .setTitle("⌛ Reminder ⌛")
            .setAuthor({ name: botName, iconURL: iconUrl })
            .addFields({
                name: "❗ Reminding you to ❗",
                value: interaction.options.getString("content"),
            })
            .setTimestamp();

        await interaction.reply({ embeds: [reminderRequestEmbed], ephemeral: true });

        const message = interaction.user;

        const sleep = async (ms) => await new Promise((r) => setTimeout(r, ms));
        await sleep(time_send_in);

        console.log("Finished sleeping after " + time_send_in / 1000 + " seconds");
        message.send({ embeds: [reminderEmbed] });
    },
};
