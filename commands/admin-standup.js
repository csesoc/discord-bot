const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");

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
                )
                .addIntegerOption((option) =>
                    option
                        .setName("days")
                        .setDescription("Number of days in past to retrieve standups from")
                        .setRequired(false),
                ),
        ),

    async execute(interaction) {
        const standupDB = global.standupDBGlobal;
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return await interaction.reply({
                content: "You do not have permission to execute this command.",
                ephemeral: true,
            });
        }
        if (interaction.options.getSubcommand() === "getfullstandups") {
            // var teamName = await interaction.options.getString('team');
            let sendmsg = "";

            try {
                const team = await interaction.options.getMentionable("teamrole");
                const numDaysToRetrieve = (await interaction.options.getInteger("days")) ?? 5;
                const teamRoleID = team.id;
                const role = await interaction.guild.roles.fetch(teamRoleID);
                /*eslint-disable */
                const roleMembers = [...role.members?.values()];
                /* eslint-enable */

                const thisTeamId = interaction.channel.parentId;
                const thisTeamStandups = await standupDB.getStandups(thisTeamId, numDaysToRetrieve);

                const roleNames = {};
                roleMembers.forEach((el) => {
                    roleNames[el.user.id] = el.user.username;
                });

                const standupDone = [];
                // add all standups
                thisTeamStandups.forEach((standUp) => {
                    standupDone.push(standUp.user_id);
                    sendmsg += `${roleNames[standUp.user_id]}` + "\n" + standUp.standup_content;
                    sendmsg += "\n";
                });

                const notDone = [];

                roleMembers.forEach((el) => {
                    const id = el.user.id;
                    if (!standupDone.includes(id)) {
                        notDone.push(id);
                    }
                });

                let notDoneUsersString = "";
                notDoneUsersString = notDone.map((el) => `${roleNames[el]}`).join(", ");

                sendmsg += "\n" + "These users have not done their standup:\n" + notDoneUsersString;

                await interaction.reply(sendmsg);
            } catch (error) {
                sendmsg = "An error - " + error;
                await interaction.reply(sendmsg);
            }
        } else if (interaction.options.getSubcommand() === "resetstandups") {
            try {
                await standupDB.deleteAllStandups();
                await interaction.reply({
                    content: "Standups reset",
                    ephemeral: true,
                });
            } catch (e) {
                await interaction.reply({
                    content: `Error when resetting standups:${e}`,
                    ephemeral: true,
                });
            }
        }
    },
};
