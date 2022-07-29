const { SlashCommandBuilder } = require("@discordjs/builders");
const { channel } = require("diagnostics_channel");
const path = require("path");
const fs = require('fs');
const { Util } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("anonymouspost")
        .setDescription("Make a post anonymously, the bot will send it on your behalf.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("current")
                .setDescription("post anonymously in the current channel")        
                .addStringOption(option => option.setName('message').setDescription("Enter the text you wish to post anonymously").setRequired(true)),    
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("channel")
                .setDescription("post anonymously in another channel")
                .addStringOption(option => option.setName('message').setDescription("Enter the text you wish to post anonymously").setRequired(true)) 
                .addStringOption(option => option.setName('channel').setDescription("Enter the channel you wish to post anonymously in").setRequired(true)),  
        ),
    
    async execute(interaction) {
        const text =interaction.options.getString('message');
        const msg = Util.removeMentions(text)

        const user = interaction.user.username;
        const u_id = interaction.user.id;
    
        const logDB = global.logDB;

        if (interaction.options.getSubcommand() === 'current') {
            logDB.message_create(interaction.id, u_id, user, msg, interaction.channelId);

            interaction.reply({ content: "Done!", ephemeral: true});
            interaction.guild.channels.cache.get(interaction.channelId).send(msg + '\n\n(The above message was anonymously posted by a user)')
        } else if (interaction.options.getSubcommand() === 'channel') {
            const c_name = interaction.options.getString('channel');
            const c_id = await logDB.channel_get(c_name.toLowerCase(), interaction.guild.id);
            if(c_id != null){
                logDB.message_create(interaction.id, u_id, user, msg, c_id[0].channel_id);

                interaction.reply({ content: "Done!", ephemeral: true});
                interaction.guild.channels.cache.get(c_id[0].channel_id).send(msg + '\n\n(The above message was anonymously posted by a user)')
            } else {
                interaction.reply({ content: "Channel name not in server!", ephemeral: true});
            }
        }
    },
}