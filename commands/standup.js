const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { data } = require("../config/standup.json");
const fs = require("fs");
const { notDeepEqual } = require("assert");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("standup")
        .setDescription("Manage standups")
        .addSubcommand(subcommand =>
            subcommand
                .setName("recordstandup")
                .setDescription("Records a standup")
                .addStringOption(option =>
                    option.setName('teamname')
                        .setDescription('Choose the team name')
                        .setRequired(true)
                        .addChoice('Notangles','Notangles')
                        .addChoice('Circles','Circles')
                        .addChoice('CSElectives','CSElectives')
                        .addChoice('Discord Bot', 'Discord Bot')
                        .addChoice('FreeRooms', 'FreeRooms')
                        .addChoice('Jobsboard', 'Jobsboard')
                        .addChoice('Website',  'Website')
                        )
                .addStringOption(option => option.setName("whatyoudid").setDescription("What you did?").setRequired(true))
                .addStringOption(option => option.setName("whatyouwilldo").setDescription("What you will do").setRequired(true))
                .addStringOption(option => option.setName("anyproblems").setDescription("Just say none with nothing").setRequired(true))
        )
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
                .setName("getstandups") 
                .setDescription("Returns all standups")
                .addMentionableOption(option => option.setName("team").setDescription("Mention the Team role to get their standup").setRequired(true))
        )        

    ,
    async execute(interaction) {
        // Starting a vote
        if (interaction.options.getSubcommand() === 'recordstandup') {
            
            // Getting the required string and data from the input
            var teamName = await interaction.options.getString("teamname");
            var voteauthorid = interaction.user.id;
            var voteauthorname = interaction.member.nickname;
            
            var whatyoudid = await interaction.options.getString("whatyoudid");
            var whatyouwilldo = await interaction.options.getString("whatyouwilldo");
            var anyproblems = await interaction.options.getString("anyproblems");
            
            console.log('Team Name: ' + teamName);
            console.log('Vote Author ID: ' + voteauthorid);
            console.log('Vote Author Name: ' + voteauthorname);


            await interaction.reply("Done! Standup recorded!");
            console.log(data);

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
            console.log(data);

            // data.unshift({ 'string': votestring, 'authorid': voteauthorid, 'channelid': channelid, 'messageid': messageid })
            fs.writeFileSync("./config/standup.json", JSON.stringify({ data: data }, null, 4));

        }
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({ content: "You do not have permission to execute this command.", ephemeral: true });
        }
        if (interaction.options.getSubcommand() === 'getstandups') {
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
                    notDoneNames += member.nickname + '\n';
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
