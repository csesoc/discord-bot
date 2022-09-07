const { MessageEmbed } = require("discord.js");

// Checks database every minute to check if a reminder needs
// to be sent to the users who reacted with an alarm clock emoji in the original
// scheduled post. Reminders are direct messages to the user contaning the content
// of the original message.

module.exports = {
    name: "ready",
    once: true,
    execute(client) {

        setInterval(async () => {
            var today = new Date();
            
            var year = String(today.getFullYear()).padStart(4, '0');
            var month = String(today.getMonth() + 1).padStart(2, '0');
            var day = String(today.getDate()).padStart(2, '0');
            var hour = String(today.getHours()).padStart(2, '0');
            var minute = String(today.getMinutes()).padStart(2, '0');
            var now_time = `${year}-${month}-${day} ${hour}:${minute}`;

            var reminders = await schedulePost.get_reminders(now_time);

            for (const reminder of reminders) {
                try {
                    var sent_channel = await client.channels.fetch(reminder.send_channel_id);
                    var sent_msg = await sent_channel.messages.fetch(reminder.sent_msg_id);
                    
                    const reaction = sent_msg.reactions.cache.get('⏰')
                    const users_reacted = await reaction.users.fetch();
                    
                    users_reacted.forEach((user) => {
                        if (!user.bot) {
                            const reminder_msg = new MessageEmbed()
                                .setColor('#C492B1')
                                .setTitle('Reminder')
                                .setDescription(sent_msg.content.length === 0 ? ' ' : sent_msg.content)
                            
                            client.users.cache.get(user.id).send({
                                embeds: [reminder_msg]
                            })
                        }
                    })
                    await schedulePost.remove_scheduled(reminder.scheduled_post_id);
                } catch (err) {
                    console.log("An error occured in sendscheduled_reminders.js " + err)
                }

            }

        }, 1000 * 60)
    },
};
