const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed,Permissions } = require("discord.js");
var { data } = require("../config/standup.json");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("standupstatus")
        .setDescription("Get standups [ADMIN]")
        .addSubcommand(subcommand =>
            subcommand
                .setName("liststandups") 
                .setDescription("Returns the list of people who have not done their standups")
                .addMentionableOption(option => option.setName("team").setDescription("Mention the Team role to get their standup").setRequired(true))

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("resetstandups")
                .setDescription("Admin command to reset all standups"))
        .addSubcommand(subcommand =>
            subcommand
                .setName("getfullstandups") 
                .setDescription("Returns all standups")
                .addMentionableOption(option => option.setName("team").setDescription("Mention the Team role to get their standup").setRequired(true))
        )        

    ,
    async execute(interaction) {
        // Starting a vote
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({ content: "You do not have permission to execute this command.", ephemeral: true });
        }
        if (interaction.options.getSubcommand() === 'getfullstandups') {
            var teamRole = await interaction.options.getMentionable("team");
            var teamRoleId = teamRole.id;
            var teamRoleName = teamRole.name;
            var sendmsg = ''
            if (data[teamRoleName] != undefined ){
                // console.log(teamMembers);
                    data[teamRoleName].forEach(element => {
                        sendmsg += element.voteauthorname + '\n' + 'What they did: ' + element.whatyoudid + '\n' + 'What they will do: '+element.whatyouwilldo + '\n' + 'Any problems?: '+element.anyproblems + '\n';
                        sendmsg += '\n';
                    });
            }
            else {
                sendmsg = 'No standups recorded for this team';
            }
            await interaction.reply(sendmsg);

        }
        else if (interaction.options.getSubcommand() === 'resetstandups') {
            data = {};
            fs.writeFileSync("./config/standup.json", JSON.stringify({ data: {} }, null, 4));
            await interaction.reply("Standups reset!");
        }
        else if (interaction.options.getSubcommand() === 'liststandups') {
            
            /*
                Iterate over 
            */
            const msgEmbed = new MessageEmbed();
            var teamMembers = [];
            var doneMembers = [];
            var notDone = [];
            var notDoneNames = '';
            var teamRole = await interaction.options.getMentionable("team");
            var teamRoleId = teamRole.id;
            var teamRoleName = teamRole.name;
            var guildRoleManager = interaction.guild.roles;

            msgEmbed.setTitle(teamRoleName + " Standup - Not Done");
            msgEmbed.setDescription("These people haven't done their standup yet");

            guildRoleManager.fetch(teamRoleId ,{cache:false,force: true}).then(role => {
    
                var roleMembers = role.members;
                
                for (const user of roleMembers.keys()) {
                    teamMembers.push(user);
                  }
                if (data[teamRoleName] != undefined ){
                // console.log(teamMembers);
                    data[teamRoleName].forEach(element => {
                        doneMembers.push(element.voteauthorid);
                    });
                }

                // console.log(doneMembers);
                let difference = teamMembers.filter(x => !doneMembers.includes(x));
                //console.log(difference);
                    
                difference.forEach(element => {
                    var member = interaction.guild.members.cache.get(element);
                    if(member.nickname != null){
                        notDoneNames += member.nickname + '\n';
                    }
                    else {
                        notDoneNames += member.user.username + '\n';
                    }
                    //console.log(notDoneNames);
                   })
            
            //console.log(notDoneNames);
            if(notDoneNames == '') {
                msgEmbed.setTitle(teamRoleName + " Standup - All Done");
                msgEmbed.setDescription("All members have done their standup");
                (async () => {
                    await interaction.reply({ embeds: [msgEmbed] });
                })();

            }
            else {
                msgEmbed.addFields({name: "Not Done", value: notDoneNames});
                (async () => {
                    await interaction.reply({ embeds: [msgEmbed] });
                })();

            }
            });
        }


    }
};
