const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");
let { data } = require("../config/standup.json");
const fs = require("fs");
const closest_match = require("closest-match");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("standupstatus")
        .setDescription("Get standups [ADMIN]")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("resetstandups")
                .setDescription("Admin command to reset all standups"),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("getfullstandups")
                .setDescription("Returns all standups")
                .addMentionableOption((option) =>
                    option
                        .setName("teamrole")
                        .setDescription("Mention the team role (@team-role)")
                        .setRequired(true),
                ),
        ),

    async execute(interaction) {
        // Starting a vote
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({
                content: "You do not have permission to execute this command.",
                ephemeral: true,
            });
        }
        if (interaction.options.getSubcommand() === "getfullstandups") {
            // let teamName = await interaction.options.getString('team');
            let sendmsg = "";
            try {
                let tempData;
                try {
                    tempData = fs.readFileSync("./config/standup.json", "utf8");
                } catch (err) {
                    console.error(err);
                }
                data = JSON.parse(tempData)["data"];

                const team = await interaction.options.getMentionable("teamrole");
                const teamRoleID = team.id;
                const teamName = team.name;
                const teams = Object.keys(data);
                const key = closest_match.closestMatch(teamName, teams);

                const standupDone = [];
                if (data[key] != undefined) {
                    data[key].forEach((element) => {
                        standupDone.push(element.voteauthorid);
                        element.mentions.forEach((user_id) => {
                            standupDone.push(user_id);
                        });
                        sendmsg += element.voteauthorname + "\n" + element.standup;
                        sendmsg += "\n\n";
                    });
                } else {
                    sendmsg = "No standups recorded for this team";
                }
                const notDone = [];
                const role = await interaction.guild.roles.fetch(teamRoleID);
                const roleMembers = [...role.members.values()];
                roleMembers.forEach((item) => {
                    const id = String(item.user.id);
                    console.log(item);
                    if (!standupDone.includes(id)) {
                        let author = item.nickname;
                        if (author == undefined) {
                            author = item.user.username;
                        }
                        notDone.push(author);
                    }
                });
                sendmsg += "\n\n" + "These users have not done their standup:\n";
                notDone.forEach((item, index) => {
                    if (index == 0) {
                        sendmsg += item;
                    } else {
                        sendmsg += ", " + item;
                    }
                });

                await interaction.reply(sendmsg);
            } catch (error) {
                sendmsg = "An error - " + error;
                await interaction.reply(sendmsg);
            }
        } else if (interaction.options.getSubcommand() === "resetstandups") {
            data = {};
            fs.writeFileSync("./config/standup.json", JSON.stringify({ data: {} }, null, 4));
            await interaction.reply("Standups reset!");
        }
    },
};
