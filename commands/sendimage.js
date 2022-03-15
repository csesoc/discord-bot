const { SlashCommandBuilder } = require("@discordjs/builders");
const { channel } = require("diagnostics_channel");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sendimage")
        .setDescription("Schedule a message to be sent to a nominated channel at a specific time.")
        .addStringOption(option => option.setName('messageid').setDescription("Enter ID of the message you want to be scheduled").setRequired(true))
        .addChannelOption(option => option.setName('channelid').setDescription("Select the channel to send the message").setRequired(true)),
    async execute(interaction) {
        // interaction = CommandInteraction class

        // Cannot send images with the same name? 
        // Hardcoded changing name (with counter)
        // Hardcoded not being able to relay an empty message (with just attachments)
        
        const message_id = interaction.options.getString('messageid');
        const channel_obj = interaction.options.getChannel('channelid');

        var message = await interaction.channel.messages.fetch(message_id);
        var actual_message = message.content;
        var attachments = message.attachments;

        var attachments = message.attachments.values();

        var actual_attachments = []
        var initial = attachments.next()

        var counter = 0;
        while (!initial.done) {
            var name = initial.value.name.split('.');
            console.log(initial.name)
            initial.value = initial.value.setName(name[0] + counter + '.' + name[1])
            actual_attachments.push(initial.value)
            initial = attachments.next()
            counter++;
        }

        console.log(actual_attachments);


        // var fs = require('fs');
        // fs.readFile(path.join(__dirname, '../data/schedulemessage.json'), (err, jsonString) => {
        //     if (err) {
        //         console.log("Error reading file from disk:", err)
        //         return
        //     }
        //     else {
        //         const to_send = JSON.parse(jsonString);
        //         to_send.push(data);
        //         jsonData = JSON.stringify(to_send);
        //         fs.writeFile(path.join(__dirname, '../data/schedulemessage.json'), jsonData, function(err) {
        //             if (err) {
        //                 console.log(err);
        //             }
        //         })
                
        //     }
        // });

        await interaction.reply({
            content: actual_message.length === 0 ? ' ' : actual_message, 
            files: actual_attachments,
            ephemeral: false
        });
    },
};