//@ts-check
const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, EmbedBuilder, ChatInputCommandInteraction, ChannelType, ButtonStyle } = require("discord.js");
const { Pagination } = require("pagination.djs");
const fs = require("fs");

/** @type {string[]} */
const allowedChannels = require("../config/anon_channel.json").allowedChannels;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("anonymouspost")
        .setDescription("Make a post anonymously, the bot will send it on your behalf.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("current")
                .setDescription("post anonymously in the current channel")
                .addStringOption((option) =>
                    option
                        .setName("message")
                        .setDescription("Enter the text you wish to post anonymously")
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("channel")
                .setDescription("post anonymously in another channel")
                .addStringOption((option) =>
                    option
                        .setName("message")
                        .setDescription("Enter the text you wish to post anonymously")
                        .setRequired(true),
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Enter the channel you wish to post anonymously in")
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("allow")
                .setDescription("[ADMIN] Allows a channel to be added.")
                .addChannelOption((option) =>
                    option.setName("channel").setDescription("Channel to allow").setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("allowcurrent")
                .setDescription("[ADMIN] Allows channel which command is executed to be added."),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("disallow")
                .setDescription("[ADMIN] Disallows a channel to be added.")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Channel to disallow")
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("disallowcurrent")
                .setDescription(
                    "[ADMIN] IDisallows channel which command is executed to be added.",
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("whitelist")
                .setDescription("[ADMIN] Displays the list of allowed channels."),
        ),

    /**
     * @param {ChatInputCommandInteraction} interaction
     * @returns
     */
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return;
        const user = interaction.user.username;
        const u_id = interaction.user.id;

        const logDB = global.logDB;

        if (interaction.options.getSubcommand() === "current") {
            if (!allowedChannels.some((c) => c === interaction.channelId)) {
                const c_name = await logDB.channelname_get(interaction.channelId);
                return await interaction.reply({
                    content: `❌ | You are not allowed to post anonymously in the channel \`${c_name[0].channel_name}\`.`,
                    ephemeral: true,
                });
            }
            const text = interaction.options.getString("message");

            // removeMentions is deprecated from discordjs v14+ onwards
            // const msg = Util.removeMentions(text);
            const msg = text;

            logDB.message_create(interaction.id, u_id, user, msg, interaction.channelId);

            await interaction.reply({ content: "Done!", ephemeral: true });
            if (!interaction.channel) return;

            await interaction.channel.send({
                content: `${msg} \n\n(The above message was anonymously posted by a user)`,
                allowedMentions: {} 
            });
            // interaction.guild.channels.cache
            //     .get(interaction.channelId)
            //     .send(msg + "\n\n(The above message was anonymously posted by a user)");
            return;
        } else if (interaction.options.getSubcommand() === "channel") {
            const channel = interaction.options.getChannel("channel", true);
            const c_name = channel.name;
            const c_id = channel.id;

            if (channel.type != ChannelType.GuildText) {
                return await interaction.reply({
                    content: `Channel \`${c_name}\` not a text channel!`,
                    ephemeral: true,
                });
            } else if (!allowedChannels.some((c) => c === c_id)) {
                return await interaction.reply({
                    content: `❌ | You are not allowed to post anonymously in the channel \`${c_name}\`.`,
                    ephemeral: true,
                });
            }

            const text = interaction.options.getString("message");
            // const msg = Util.removeMentions(text);
            const msg = text;

            logDB.message_create(interaction.id, u_id, user, msg, c_id);

            await interaction.reply({ content: "Done!", ephemeral: true });
            const guild = interaction.guild;
            if (!guild) return;

            const channel_send = guild.channels.cache.get(c_id);
            if (!channel_send || !channel_send.isTextBased()) return;

            return await channel_send.send({
                content: `${msg} \n\n(The above message was anonymously posted by a user)`, 
                allowedMentions: {}
            });
            // return await interaction.guild.channels.cache
            //     .get(c_id)
            //     .send(msg + "\n\n(The above message was anonymously posted by a user)");
        }

        // Admin permission check
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: "You do not have permission to execute this command.",
                ephemeral: true,
            });
        }

        if (interaction.options.getSubcommand() === "allow") {
            const channel = interaction.options.getChannel("channel", true);

            if (allowedChannels.some((c) => c === channel.id)) {
                return await interaction.reply({
                    content: `❌ | The allowed channels list already contains \`${channel.name}\`.`,
                    ephemeral: true,
                });
            }

            allowedChannels.push(channel.id);

            // The path here is different to the require because it's called from index.js (I think)
            fs.writeFileSync(
                "./config/anon_channel.json",
                JSON.stringify({ allowedChannels: allowedChannels }, null, 4),
            );

            return await interaction.reply({
                content: `✅ | Allowed the channel \`${channel.name}\`.`,
                ephemeral: true,
            });
        } else if (interaction.options.getSubcommand() === "allowcurrent") {
            const c_name = await logDB.channelname_get(interaction.channelId);

            if (allowedChannels.some((c) => c === interaction.channelId)) {
                return await interaction.reply({
                    content: `❌ | The allowed channels list already contains \`${c_name[0].channel_name}\`. Channel ID - \`${interaction.channelId}\``,
                    ephemeral: true,
                });
            }

            allowedChannels.push(interaction.channelId);

            // The path here is different to the require because it's called from index.js (I think)
            fs.writeFileSync(
                "./config/anon_channel.json",
                JSON.stringify({ allowedChannels: allowedChannels }, null, 4),
            );

            return await interaction.reply({
                content: `✅ | Allowed the channel \`${c_name[0].channel_name}\`.`,
                ephemeral: true,
            });
        } else if (interaction.options.getSubcommand() === "disallow") {
            const channel = interaction.options.getChannel("channel", true);

            if (!allowedChannels.some((c) => c === channel.id)) {
                return await interaction.reply({
                    content: `❌ | The allowed channel list does not contain \`${channel.name}\`.`,
                    ephemeral: true,
                });
            }

            allowedChannels.splice(allowedChannels.indexOf(channel.id), 1);

            // The path here is different to the require because it's called from index.js (I think)
            fs.writeFileSync(
                "./config/anon_channel.json",
                JSON.stringify({ allowedChannels: allowedChannels }, null, 4),
            );

            return await interaction.reply({
                content: `✅ | Disallowed the channel \`${channel.name}\`.`,
                ephemeral: true,
            });
        } else if (interaction.options.getSubcommand() === "disallowcurrent") {
            const c_name = await logDB.channelname_get(interaction.channelId);

            if (!allowedChannels.some((c) => c === interaction.channelId)) {
                return await interaction.reply({
                    content: `❌ | The allowed channel list does not contain \`${c_name[0].channel_name}\`.`,
                    ephemeral: true,
                });
            }

            allowedChannels.splice(allowedChannels.indexOf(interaction.channelId), 1);

            // The path here is different to the require because it's called from index.js (I think)
            fs.writeFileSync(
                "./config/anon_channel.json",
                JSON.stringify({ allowedChannels: allowedChannels }, null, 4),
            );

            return await interaction.reply({
                content: `✅ | Disallowed the channel \`${c_name[0].channel_name}\`.`,
                ephemeral: true,
            });
        } else if (interaction.options.getSubcommand() === "whitelist") {
            // No allowed roles
            if (allowedChannels.length == 0) {
                const embed = new EmbedBuilder()
                    .setTitle("Allowed Channels")
                    .setDescription("No allowed channels");
                return await interaction.reply({ embeds: [embed] });
            }

            // TODO: Convert to scroller?
            
            /** @type {string[]} */
            const channels = [];
            for (let i = 0; i < allowedChannels.length; i += 1) {
                // c_name is an array of objects that contains channel_name and guild_id as properties
                const c_name = await logDB.channelname_get(allowedChannels[i]);
                if (c_name[0].guild_id === interaction.guildId) {
                    channels[i] = c_name[0].channel_name;
                }
            }

            if (channels.length == 0) {
                const embed = new EmbedBuilder()
                    .setTitle("Allowed Channels")
                    .setDescription("No allowed channels");
                return await interaction.reply({ embeds: [embed] });
            }

            const channelsPerPage = 10;

            const embedList = [];
            for (let i = 0; i < channels.length; i += channelsPerPage) {
                embedList.push(
                    new EmbedBuilder()
                        .setTitle("Allowed Channels")
                        .setDescription(channels.slice(i, i + channelsPerPage).join("\n")),
                );
            }

            const buttonList = [
                new ButtonBuilder()
                    .setCustomId("previousbtn")
                    .setLabel("Previous")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("nextbtn").setLabel("Next").setStyle(ButtonStyle.Success),
            ];

            // may need to tweak this as necessary
            const pagination = new Pagination(interaction, {
                firstEmoji: '⏮', // First button emoji
                prevEmoji: '◀️', // Previous button emoji
                nextEmoji: '▶️', // Next button emoji
                lastEmoji: '⏭', // Last button emoji
                prevLabel: "Previous",
                nextLabel: "Next",
            });

            /** @type {Record<string, ButtonBuilder>} */
            const buttons = buttonList.reduce((_, button, i) => Object.assign(String(i), button), {});
            pagination.addEmbeds(embedList);
            pagination.setButtons(buttons);
            await pagination.reply();

            // use of deprecated libary
            // return paginationEmbed(interaction, embedList, buttonList);
        }
    },
};
