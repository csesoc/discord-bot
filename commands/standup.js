const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed,Permissions } = require("discord.js");
var { data } = require("../config/standup.json");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("standup")
        .setDescription("Records a standup")
        .addMentionableOption(option => option.setName("team").setDescription("Mention the Team role").setRequired(true))
        .addStringOption(option => option.setName("whatyoudid").setDescription("What you did?").setRequired(true))
        .addStringOption(option => option.setName("whatyouwilldo").setDescription("What you will do").setRequired(true))
        .addStringOption(option => option.setName("anyproblems").setDescription("Any problems faced").setRequired(true))

    ,
    async execute(interaction) {
        // Starting a vote
            var teamRole = await interaction.options.getMentionable("team");
            // Getting the required string and data from the input
            var teamName = teamRole.name;
            var voteauthorid = interaction.user.id;
            var voteauthorname = interaction.member.nickname;
            if(voteauthorname == null) {
                voteauthorname = interaction.user.username;
            }
            var whatyoudid = await interaction.options.getString("whatyoudid");
            var whatyouwilldo = await interaction.options.getString("whatyouwilldo");
            var anyproblems = await interaction.options.getString("anyproblems");
            
            //console.log('Team Name: ' + teamName);
            //console.log('Vote Author ID: ' + voteauthorid);
            //console.log('Vote Author Name: ' + voteauthorname);
            reply = voteauthorname + "\n\n";
            reply += "What you did: \n" + whatyoudid + '\n\n';
            reply += "What you will do: \n" + whatyouwilldo+"\n\n";
            reply += "Any Problems: \n" + anyproblems
            await interaction.reply(reply);
            //console.log(data);

            // Writing to the data file
            if(teamName in data) {
                data[teamName].push({
                    "voteauthorid": voteauthorid,
                    "voteauthorname": voteauthorname,
                    "whatyoudid": whatyoudid,
                    "whatyouwilldo": whatyouwilldo,
                    "anyproblems": anyproblems
                });
            }
            else {
                data[teamName] = [{
                    "voteauthorid": voteauthorid,
                    "voteauthorname": voteauthorname,
                    "whatyoudid": whatyoudid,
                    "whatyouwilldo": whatyouwilldo,
                    "anyproblems": anyproblems
                }];
            }
            //console.log(data);

            // data.unshift({ 'string': votestring, 'authorid': voteauthorid, 'channelid': channelid, 'messageid': messageid })
            fs.writeFileSync("./config/standup.json", JSON.stringify({ data: data }, null, 4));


    }
};
