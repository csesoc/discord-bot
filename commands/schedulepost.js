const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, Permissions } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("schedulepost")
        .setDescription("Schedule Posts")
        .addSubcommand(subcommand =>
            subcommand
                .setName("create")
                .setDescription("Schedule a message to be sent to a nominated channel at a specific time.")
                .addStringOption(option =>
                    option
                        .setName('messageid')
                        .setDescription("Enter ID of the message you want to be scheduled")
                        .setRequired(true))
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription("Select the channel to send the message")
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('datetime')
                        .setDescription("Enter the time as YYYY-MM-DD HH:MM")
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reminder')
                        .setDescription("Optional: Send a reminder to users about this who react with ⏰ at YYYY-MM-DD HH:MM")))
        .addSubcommand(subcommand =>
            subcommand
                .setName("cancel")
                .setDescription("cancel a scheduled post")
                .addStringOption(option =>
                    option
                        .setName('messageid')
                        .setDescription("Enter ID of the message you want to cancel")
                        .setRequired(true))
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription("Select the channel where the message is scheduled to send.")
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('datetime')
                        .setDescription("Enter the time of the initial scheduled message as YYYY-MM-DD HH:MM")
                        .setRequired(true))),

    async execute(interaction) {
        // Check if user has admin permission
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({
                content: "You do not have permission to execute this command.",
                ephemeral: true,
            });
        }

        const command = interaction.options.getSubcommand();
        const msg_id = interaction.options.getString('messageid');
        const channel = interaction.options.getChannel('channel');
        const datetime = interaction.options.getString('datetime');

        if (command === "create") {
            create_scheduled_post(interaction, msg_id, channel, datetime);
        } else if (command === "cancel") {
            cancel_scheduled_post(interaction, msg_id, channel, datetime);
        }
    },
};


// Schedules a new post
async function create_scheduled_post(interaction, msg_id, channel, datetime) {

    // Check if message id is valid
    let message;
    try {
        message = await interaction.channel.messages.fetch(msg_id);
    } catch (err) {
        return await interaction.reply({
            content: "Invalid message ID",
            ephemeral: true,
        });
    }

    const re = /^\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;

    // Check if datetime is valid
    if (!re.test(datetime)) {
        return await interaction.reply({
            content: "Please enter the datetime as YYYY-MM-DD HH:MM exactly",
            ephemeral: true,
        });
    }

    // If reminders are needed, check if the date and time of the reminder is valid
    const user_reminder = interaction.options.getString('reminder');
    if (user_reminder && !re.test(user_reminder)) {
        return await interaction.reply({
            content: "Please enter the reminder as YYYY-MM-DD HH:MM exactly",
            ephemeral: true,
        });
    }

    // Check that the reminder date is after the datetime of when the message is scheduled for
    if (user_reminder && user_reminder <= datetime) {
        return await interaction.reply({
            content: "Please enter a reminder date that is after the datetime of the scheduled post",
            ephemeral: true,
        });
    }

    const send_time = new Date(datetime);
    const today = new Date();
    const now_time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes(), 0);
    const time_send_in = send_time - now_time;

    // Check that the datetime the post is scheduled for is in the futre
    if (time_send_in <= 0) {
        return await interaction.reply({
            content: "Please enter a datetime in the future for 'datetime'",
            ephemeral: true,
        });
    }

    // Calculate how long until the scheduled message will be sent
    const seconds = Number(time_send_in / 1000);

    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    const dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    const hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    const sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";

    const send_in = ("in " + dDisplay + hDisplay + mDisplay + sDisplay).replace(/,\s*$/, "");

    // Create message preview
    const preview = new MessageEmbed()
        .setColor('#C492B1')
        .setTitle('Message Preview')
        .setDescription(message.content.length === 0 ? ' ' : message.content + (user_reminder ? "\n \n react ⏰ to be notified about this event!" : ""));

    // Add scheduled post to database
    const schedulePost = global.schedulePost;
    await schedulePost.add_react_role_msg(interaction.guildId, msg_id, interaction.channelId, channel.id, datetime, user_reminder);

    // Create user reply with all the details of the scheduled post
    let reply_msg = `Message #${msg_id} is scheduled for channel '${channel.name}' at ${datetime} (${send_in}).`;
    const num_msg_attachments = message.attachments.size;

    if (num_msg_attachments) {
        reply_msg += `\nThis message has ${num_msg_attachments} attachment${num_msg_attachments === 1 ? "" : "s"}.`;
    }

    if (user_reminder) {
        reply_msg += `\nReminders will be sent to users who react '⏰' at ${user_reminder}.`;
    }

    reply_msg += `\nUse \`\\schedulepost cancel\` to cancel this.`;

    await interaction.reply({
        content: reply_msg,
        ephemeral: false,
        embeds: [preview],
    });
}

// Cancels a scheduled post
async function cancel_scheduled_post(interaction, msg_id, channel, datetime) {
    const channel_name = channel.name;
    const channel_id = channel.id;
    const schedulePost = global.schedulePost;
    const schedule_post_id = await schedulePost.get_scheduled_post_id(msg_id, channel_id, datetime);

    if (schedule_post_id) {
        await schedulePost.remove_scheduled(schedule_post_id);
        await interaction.reply({
            content: "Message #" + msg_id + " scheduled for channel '" + channel_name + "' at " + datetime + " was successfully deleted!",
        });
    } else {
        await interaction.reply({
            content: "No matching scheduled message was found.",
        });
    }
}