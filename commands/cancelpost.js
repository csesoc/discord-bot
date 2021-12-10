const { SlashCommandBuilder } = require("@discordjs/builders");
const { channel } = require("diagnostics_channel");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("cancelpost")
        .setDescription("Need to cancel .")
        .addStringOption(option => option.setName('messageid').setDescription("Enter ID of the message you want to cancel sending."))
        .addChannelOption(option => option.setName('channelid').setDescription("Select the channel where the message is scheduled to send.")),
    async execute(interaction) {
        const message_id = interaction.options.getString('messageid');
        const channel_obj = interaction.options.getChannel('channelid');
        
        var to_delete = null;
        const name = channel_obj.name

        var fs = require('fs');
        fs.readFile(path.join(__dirname, '../data/schedulemessage.json'), (err, jsonString) => {
            if (err) {
                console.log("Error reading file from disk:", err)
                return
            }
            else {
                const to_send = JSON.parse(jsonString);
                to_send.forEach( function (item, index) {
                    if (item[3] == message_id && item[1] == channel_obj.id) {
                        to_delete = index;
                    }
                }
                )
                if (to_delete != null) {
                    to_send.splice(to_delete, 1);
                    jsonData = JSON.stringify(to_send);
                    fs.writeFile(path.join(__dirname, '../data/schedulemessage.json'), jsonData, function(err) {
                        if (err) {
                            console.log(err);
                        }
                    })
                }
            }
        });
        const wait = require('util').promisify(setTimeout);
        await wait(2000);
        if (to_delete != null) {
            await interaction.reply({content: "Message #" + message_id + " scheduled for channel '" + name +  "' was successfully deleted!"});
        } else {
            await interaction.reply({content: "No matching scheduled message was found."})
        }
    },
};