const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed,Permissions } = require("discord.js");
var { data } = require("../config/standup.json");
const fs = require("fs");
const closest_match = require('closest-match');
const standup = require("./standup");

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
                .addStringOption(option => option.setName("team").setDescription("Mention the Team role to get their standup").setRequired(true))
        )        

    ,
    async execute(interaction) {
        // Starting a vote
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({ content: "You do not have permission to execute this command.", ephemeral: true });
        }
        if (interaction.options.getSubcommand() === 'getfullstandups') {
            var teamName = await interaction.options.getString('team');
            var teams = Object.keys(data);
            var key = closest_match.closestMatch(teamName,teams);

            var sendmsg = ''
            if (data[key] != undefined ){
                // console.log(teamMembers);
                    data[key].forEach(element => {
                        sendmsg += element.voteauthorname + '\n' + element.standup;
                        sendmsg += '\n\n';
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


    }
};
