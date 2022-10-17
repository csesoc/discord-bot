const { MessageAttachment } = require("discord.js");

// Checks database every minute to see if there is a message to be sent

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        setInterval(async () => {
            const today = new Date();

            const year = String(today.getFullYear()).padStart(4, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const hour = String(today.getHours()).padStart(2, '0');
            const minute = String(today.getMinutes()).padStart(2, '0');
            const now_time = `${year}-${month}-${day} ${hour}:${minute}`;

            const schedulePost = global.schedulePost;
            const scheduled = await schedulePost.get_scheduled(now_time);

            for (const post of scheduled) {
                try {
                    const reminder = post.reminder;
                    const send_channel = client.channels.cache.get(post.send_channel_id);
                    const init_channel = client.channels.cache.get(post.init_channel_id);
                    const send_msg = await init_channel.messages.fetch(post.msg_id);

                    // Retrieve attachments if applicable
                    const attachment_list = [];
                    send_msg.attachments.forEach(attachment => {
                        attachment_list.push(new MessageAttachment(attachment.proxyURL));
                    });

                    // Retrieve message content
                    let message_content = send_msg.content ? send_msg.content : " ";

                    if (reminder) {
                        message_content = send_msg.content + "\n \n react ⏰ to be notified about this event!";
                    }

                    // Send the scheduled message
                    send_channel.send({
                        content: message_content,
                        files: attachment_list,
                    }).then(async (sent_message) => {
                        if (reminder) {
                            sent_message.react('⏰');
                            await schedulePost.add_reminder(sent_message.id, post.scheduled_post_id);
                        } else {
                            await schedulePost.remove_scheduled(post.scheduled_post_id);
                        }
                    });

                } catch (err) {
                    console.log("An error occured in sendscheduled.js " + err);
                }
            }

        }, 1000 * 60);
    },
};
