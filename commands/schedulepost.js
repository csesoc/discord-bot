const { SlashCommandBuilder } = require("@discordjs/builders");
const { channel } = require("diagnostics_channel");
const { MessageEmbed, Permissions } = require("discord.js");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("schedulepost")
        .setDescription("Schedule a message to be sent to a nominated channel at a specific time.")
        .addStringOption(option => option.setName('messageid').setDescription("Enter ID of the message you want to be scheduled").setRequired(true))
        .addChannelOption(option => option.setName('channelid').setDescription("Select the channel to send the message").setRequired(true))
        .addStringOption(option => option.setName('datetime').setDescription("Enter the time as YYYY-MM-DD HH:MM").setRequired(true)),
    async execute(interaction) {

        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({ content: "You do not have permission to execute this command.", ephemeral: true });
        }

        const message_id = interaction.options.getString('messageid');

        var message = await interaction.channel.messages.fetch(message_id);

        var num_attachments = message.attachments.size
        if (num_attachments > 0) {
            await interaction.reply({ content: "Cannot have attachments (yet) :(", ephemeral: true});
            return;
        }

        message = message.content;

        const channel_obj = interaction.options.getChannel('channelid');
        const channel_name = channel_obj.name
        let re = /^\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;
        const datetime = interaction.options.getString('datetime');
        if (!re.test(datetime)) {
            await interaction.reply( { content: "Please enter the date as YYYY-MM-DD HH:MM exactly", ephemeral: true});
            return;
        };

        var send_time = new Date(datetime)
        var today = new Date();
        now_time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes(), 0);
        time_send_in = send_time - now_time

        if (time_send_in <= 0) {
            await interaction.reply( { content: "Please enter a date in the future", ephemeral: true});
            return;
        }

        seconds = Number(time_send_in / 1000);

        var d = Math.floor(seconds / (3600*24));
        var h = Math.floor(seconds % (3600*24) / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 60);

        var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
        var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";

        send_in = ("in " + dDisplay + hDisplay + mDisplay + sDisplay).replace(/,\s*$/, "");

        

        const preview = new MessageEmbed()
        .setColor('#C492B1')
        .setTitle('Message Preview')
        .setDescription(message.length === 0 ? ' ' : message)

        var data = [message, channel_obj.id, datetime, message_id];

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

        await interaction.reply({ 
            content: "Message #" + message_id + " for channel '" + channel_name + "' scheduled at " + datetime + " which is in " + send_in, 
            ephemeral: false, 
            embeds: [preview]
        });
    },
};