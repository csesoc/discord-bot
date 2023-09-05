import { EmbedBuilder } from "discord.js";

// Checks database every minute to check if a reminder needs
// to be sent to the users who reacted with an alarm clock emoji in the original
// scheduled post. Reminders are direct messages to the user containing the content
// of the original message.

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

            const schedulePost = (global as any).schedulePost;
            const reminders = await schedulePost.get_reminders(now_time);

            for (const reminder of reminders) {
                try {
                    const sent_channel = await client.channels.fetch(reminder.send_channel_id);
                    const sent_msg = await sent_channel.messages.fetch(reminder.sent_msg_id);

                    const reaction = sent_msg.reactions.cache.get("⏰");
                    const users_reacted = await reaction.users.fetch();

                    users_reacted.forEach((user: any) => {
                        if (!user.bot) {
                            const reminder_msg = new EmbedBuilder()
                                .setColor("#C492B1")
                                .setTitle("Reminder")
                                .setDescription(sent_msg.content.length === 0 ? " " : sent_msg.content);

                            client.users.cache.get(user.id).send({
                                embeds: [reminder_msg],
                            });
                        }
                    });
                    
                    await schedulePost.remove_scheduled(reminder.scheduled_post_id);
                } catch (err: any) {
                    console.log("An error occurred in sendscheduled_reminders.js " + err);
                }
            }
        }, 1000 * 60);
    },
};
