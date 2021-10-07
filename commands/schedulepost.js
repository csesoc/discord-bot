const { SlashCommandBuilder } = require("@discordjs/builders");
const { channel } = require("diagnostics_channel");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("schedulepost")
        .setDescription("Schedule a message to be sent to a nominated channel at a specific time.")
        .addStringOption(option => option.setName('messageid').setDescription("Enter ID of the message you want to be scheduled"))
        .addChannelOption(option => option.setName('channelid').setDescription("Select the channel to send the message"))
        .addStringOption(option => option.setName('datetime').setDescription("Enter the time as YYYY-MM-DD HH:MM")),
    async execute(interaction) {
        const message_id = interaction.options.getString('messageid');
        const channel_obj = interaction.options.getChannel('channelid');
        let re = /^\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;
        const datetime = interaction.options.getString('datetime');
        if (!re.test(datetime)) {
            await interaction.reply( { content: "One or more required fields were missing or incorrect!", ephemeral: true});
            return;
        };

        var bits = interaction.options.getString('datetime').split(/\D/);
        const curr_channel = interaction.channelId;

        var message = await interaction.channel.messages.fetch(message_id);
        message = message.content;

        var data = [message, channel_obj.id, datetime];

        var fs = require('fs');
        fs.readFile(path.join(__dirname, '../data/schedulemessage.json'), (err, jsonString) => {
            if (err) {
                console.log("Error reading file from disk:", err)
                return
            }
            else {
                const to_send = JSON.parse(jsonString);
                to_send.push(data);
                jsonData = JSON.stringify(to_send);
                fs.writeFile(path.join(__dirname, '../data/schedulemessage.json'), jsonData, function(err) {
                    if (err) {
                        console.log(err);
                    }
                })
                
            }
        });


        await interaction.reply({ content: "Posted scheduled!", ephemeral: true});
    },
};