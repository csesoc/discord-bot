const path = require("path");
const fs = require('fs');
const { MessageAttachment } = require("discord.js");

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        let timer = setInterval(function() {
            fs.readFile(path.join(__dirname, '../data/schedulemessage.json'), (err, jsonString) => {
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
                        channel_id = to_send[i][1];
                        message_id = to_send[i][0]
                        reminder = to_send[i][3]
                        send_channel = client.channels.cache.get(channel_id);

                        client.channels.fetch(channel_id).then(function (channel) {
                            channel.messages.fetch(message_id).then(function (message) {
                                attachment_list = []
                                message.attachments.forEach(attachment => { 
                                    attachment_list.push(new MessageAttachment(attachment.proxyURL))
                                })
                                message_content = message.content
                                if (reminder) {
                                    message_content = message.content + "\n \n react ⏰ to be notified about this event!"
                                }
                                send_channel.send({content: message_content ? message_content: " ", files: attachment_list}).then(function (sent_message) {
                                    if (reminder) {
                                        sent_message.react('⏰')
                                        fs.readFile(path.join(__dirname, '../data/schedulepost_reminders.json'), (err, jsonString) => {
                                            if (err) {
                                                console.log("Error reading file from disk:", err)
                                                return
                                            }
                                            var reminder_data = [sent_message.id, channel_id, reminder]
                                            const to_send_reminder = JSON.parse(jsonString);
                                            to_send_reminder.push(reminder_data);
                                            jsonData = JSON.stringify(to_send_reminder);
                                            fs.writeFile(path.join(__dirname, '../data/schedulepost_reminders.json'), jsonData, function(err) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                            });
                                        });
                                    }
                                })
                            });
                        }); 
                        to_send.splice(i, 1)
                    };
                }
                jsonData = JSON.stringify(to_send);
                    fs.writeFile(path.join(__dirname, '../data/schedulemessage.json'), jsonData, function(err) {
                        if (err) {
                            console.log(err);
                        }
                    })
            });
            
        }, 1000 * 60)
    },
};
