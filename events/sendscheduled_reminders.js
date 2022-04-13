const path = require("path");
const fs = require('fs');
const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        let timer = setInterval(function() {
            fs.readFile(path.join(__dirname, '../data/schedulepost_reminders.json'), (err, jsonString) => {
                if (err) {
                    console.log("Error reading file from disk:", err)
                    return
                }
                const to_send = JSON.parse(jsonString);
                for (var i = to_send.length - 1; i >= 0; i--) {
                    send_time = new Date(to_send[i][2]);
                    var today = new Date();
                    now_time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes(), 0);
                    if (now_time - send_time == 0) {
                        message_id = to_send[i][0]
                        channel_id = to_send[i][1];
                        
                        send_channel = client.channels.cache.get(channel_id);
                        client.channels.fetch(channel_id).then(function (channel) {
                            channel.messages.fetch(message_id).then(function (message) {
                                responses = []
                                const reaction = message.reactions.cache.get('⏰')
                                reaction.users.fetch().then(function (reaction_users) {
                                    reaction_users.forEach(function(user) {
                                        if (!user.bot) {
                                            client.channels.fetch(channel_id).then(function (channel) {
                                                channel.messages.fetch(message_id).then(function (message) {
                                                    const reminder_msg = new MessageEmbed()
                                                    .setColor('#C492B1')
                                                    .setTitle('Reminder')
                                                    .setDescription(message.content.length === 0 ? ' ' : message.content)
                                                    client.users.cache.get(user.id).send({
                                                        ephemeral: false, 
                                                        embeds: [reminder_msg]
                                                    })
                                                })
                                            })
                                        }
                                    })
                                })
                            });
                        }); 
                        to_send.splice(i, 1)
                    };
                };
                jsonData = JSON.stringify(to_send);
                fs.writeFile(path.join(__dirname, '../data/schedulepost_reminders.json'), jsonData, function(err) {
                    if (err) {
                        console.log(err);
                    }
                })
            });
            
        }, 1000 * 60)
    },
};
