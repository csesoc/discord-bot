import { MessageAttachment } from "discord.js";

// Checks database every minute to see if there is a message to be sent

export const ready = {
    name: "ready",
    once: true,
    execute(client: any): void {
        setInterval(async () => {
            const today: Date = new Date();

            const year: string = String(today.getFullYear()).padStart(4, "0");
            const month: string = String(today.getMonth() + 1).padStart(2, "0");
            const day: string = String(today.getDate()).padStart(2, "0");
            const hour: string = String(today.getHours()).padStart(2, "0");
            const minute: string = String(today.getMinutes()).padStart(2, "0");
            const now_time: string = `${year}-${month}-${day} ${hour}:${minute}`;

            const schedulePost = global.schedulePost;
            const scheduled = await schedulePost.get_scheduled(now_time);

            for (const post of scheduled) {
                try {
                    const reminder = post.reminder;
                    const send_channel = client.channels.cache.get(post.send_channel_id);
                    const init_channel = client.channels.cache.get(post.init_channel_id);
                    const send_msg = await init_channel.messages.fetch(post.msg_id);

                    // Retrieve attachments if applicable
                    const attachment_list: MessageAttachment[] = [];
                    send_msg.attachments.forEach((attachment: any) => {
                        attachment_list.push(new MessageAttachment(attachment.proxyURL));
                    });

                    // Retrieve message content
                    let message_content: string = send_msg.content ? send_msg.content : " ";

                    if (reminder) {
                        message_content = send_msg.content + "\n \n react ⏰ to be notified about this event!";
                    }

                    // Send the scheduled message
                    send_channel.send({
                        content: message_content,
                        files: attachment_list,
                        })
                        .then(async (sent_message: any) => {
                        if (reminder) {
                            sent_message.react("⏰");
                            await schedulePost.add_reminder(sent_message.id, post.scheduled_post_id);
                        } else {
                            await schedulePost.remove_scheduled(post.scheduled_post_id);
                        }
                    });
                } catch (err: any) {
                    console.log("An error occurred in sendscheduled.js " + err);
                }
            }
        }, 1000 * 60);
    },
};
