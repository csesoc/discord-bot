const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed,Permissions } = require("discord.js");
var { data } = require("../config/standup.json");
const fs = require("fs");
const closest_match = require('closest-match');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("standupstatus")
        .setDescription("Get standups [ADMIN]")
        
        .addSubcommand(subcommand =>
            subcommand
                .setName("resetstandups")
                .setDescription("Admin command to reset all standups"))
        .addSubcommand(subcommand =>
            subcommand
                .setName("getfullstandups") 
                .setDescription("Returns all standups")
                .addMentionableOption(option => option.setName("teamrole").setDescription("Mention the team role (@team-role)").setRequired(true))
        )        

    ,
    async execute(interaction) {
        // Starting a vote
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({ content: "You do not have permission to execute this command.", ephemeral: true });
        }
        if (interaction.options.getSubcommand() === 'getfullstandups') {
            //var teamName = await interaction.options.getString('team');
            var team = await interaction.options.getMentionable('teamrole')
            var teamRoleID = team.id
            var teamName = team.name
            var teams = Object.keys(data);
            var key = closest_match.closestMatch(teamName,teams);

            var sendmsg = ''
            var standupDone = []
            if (data[key] != undefined ){
                    data[key].forEach(element => {
                        standupDone.push(element.voteauthorid)
                        element.mentions.forEach(user_id => {
                            standupDone.push(user_id)
                        });
                        sendmsg += element.voteauthorname + '\n' + element.standup;
                        sendmsg += '\n\n';
                    });
            }
            else {
                sendmsg = 'No standups recorded for this team';
            }
            var notDone = []
            var role = await interaction.guild.roles.fetch(teamRoleID)
            var roleMembers = [...role.members.values()];
            roleMembers.forEach(function (item, index) {
                var id = String(item.user.id)
                
                if (!standupDone.includes(id)) {
                    var author = item.nickname;
                    if(author == undefined) {
                        author = item.user.username;
                    }
                    notDone.push(author)
                }
                });
            sendmsg += '\n\n' + "These users have not done their standup:\n" + notDone.toString()
            await interaction.reply(sendmsg);
            
            

        }
        else if (interaction.options.getSubcommand() === 'resetstandups') {
            data = {};
            fs.writeFileSync("./config/standup.json", JSON.stringify({ data: {} }, null, 4));
            await interaction.reply("Standups reset!");
        }


    }
};
