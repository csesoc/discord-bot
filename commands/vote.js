const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
var { data } = require("../config/votes.json");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("voting")
        .setDescription("Manage votes")
        .addSubcommand(subcommand =>
            subcommand
                .setName("vote")
                .setDescription("Starts a vote")
                .addStringOption(option => option.setName("votestring").setDescription("Message you want to vote").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("voteresult")
                .setDescription("Result of the last vote done on the channel")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("voteresultfull")
                .setDescription("Full result of the last vote done on the channel (includes the discord names)")
        )

    ,
    async execute(interaction) {
        // Starting a vote
        if (interaction.options.getSubcommand() === 'vote') {
            
            // Getting the required string and data from the input
            var votestring = await interaction.options.getString("votestring");
            var voteauthorid = interaction.user.id;
            var voteauthorname = interaction.user.username;
            var channelid = interaction.channelId;

            // Generating the vote string
            votestring = votestring + ', vote by ' + voteauthorname;

            // Generating the embed
            const embed = new MessageEmbed()
                .setTitle(votestring)
            const message = await interaction.reply({ embeds: [embed], fetchReply: true });
            // Adding the default reacts
            message.react('👍');
            message.react('👎');

            var messageid = message.id;

            // Writing to the data file
            data.unshift({ 'string': votestring, 'authorid': voteauthorid, 'channelid': channelid, 'messageid': messageid })
            fs.writeFileSync("./config/votes.json", JSON.stringify({ data: data }, null, 4));

        } else if (interaction.options.getSubcommand() === 'voteresult') {
            // Get the last messageid of the vote done on this channel
            var channelid = interaction.channelId;

            // Finding the required vote
            const found = data.find(element => element.channelid == channelid);
            
            if (found == undefined) {
                const embed = new MessageEmbed()
                    .setTitle("0 votes found on this channel");
                await interaction.reply({ embeds: [embed], fetchReply: true });
                return;
            } else {

                var channelID = found.channelid;
                var messageID = found.messageid;

                var msghandler = interaction.channel.messages;
                var msg = await msghandler.fetch(found.messageid);

                let cacheChannel = msg.guild.channels.cache.get(channelID);

                if (cacheChannel) {


                    cacheChannel.messages.fetch(messageID).then((reactionMessage) => {
                        responses = [];
                        reactionMessage.reactions.cache.forEach(function (value, key) {

                            if (key == '👍' || key == '👎') { responses.push({ 'name': String(key), 'value': String(value.count - 1) }); } else {
                                responses.push({ 'name': String(key), 'value': String(value.count) })
                            }


                        })
                        const embed = new MessageEmbed()
                            .setTitle(found.string)
                            .addFields(responses);

                        (async () => {
                            await interaction.reply({ embeds: [embed] });
                        })();
                    });
                }
                else {
                    // If an error occurs, Delete everything on the file
                    await interaction.reply("An error occurred");
                    data = [];
                    fs.writeFileSync("./config/votes.json", JSON.stringify({ data: data }, null, 4));

                }

            }



            //await interaction.reply("Done");

        } else if (interaction.options.getSubcommand() === 'voteresultfull') {
            // Returns the list of all users who voted
            // Get the last messageid of the vote done on this channel
            var channelid = interaction.channelId;

            const found = data.find(element => element.channelid == channelid);

            if (found == undefined) {
                const embed = new MessageEmbed()
                    .setTitle("0 votes found on this channel");
                await interaction.reply({ embeds: [embed], fetchReply: true });
                return;
            } else {

                var channelID = found.channelid;
                var messageID = found.messageid;

                var msghandler = interaction.channel.messages;
                var msg = await msghandler.fetch(found.messageid);

                let cacheChannel = msg.guild.channels.cache.get(channelID);

                if (cacheChannel) {


                    cacheChannel.messages.fetch(messageID).then((reactionMessage) => {
                        responses = [];
                        reactionMessage.reactions.cache.forEach(function (value, key) {
                            temp = {};
                            temp['name'] = String(key);
                            temp['value'] = '';
                            value.users.cache.forEach(function (value, key) {
                                if (value.bot == false) {
                                    temp['value'] = temp['value'] + '\n' + String(value.username);
                                }
                            }
                            )
                            if (temp['value'] == '') {
                                temp['value'] = 'None';
                            }
                            responses.push(temp);
                        })
                        const embed = new MessageEmbed()
                            .setTitle(found.string)
                            .addFields(responses);

                        (async () => {
                            await interaction.reply({ embeds: [embed] });
                        })();
                    });
                }
                else {
                    await interaction.reply("An error occurred");
                    data = [];
                    fs.writeFileSync("./config/votes.json", JSON.stringify({ data: data }, null, 4));

                }

            }



            //await interaction.reply("Done");

        }

    }
};
