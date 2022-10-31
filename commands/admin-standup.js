const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageButton, Permissions } = require("discord.js");
const paginationEmbed = require("discordjs-button-pagination");

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
                    let author = el.nickname;
                    if (author == undefined) {
                        author = el.user.username;
                    }
                    roleNames[el.user.id] = author;
                });

                const standupDone = [];
                const standupEmbeded = [];
                // add all standups
                thisTeamStandups.forEach((standUp) => {
                    standupDone.push(standUp.user_id);
                    standupEmbeded.push(
                        "**" +
                            `${roleNames[standUp.user_id]}` +
                            "**" +
                            "\n" +
                            standUp.standup_content,
                    );
                    sendmsg +=
                        "**" +
                        `${roleNames[standUp.user_id]}` +
                        "**" +
                        "\n" +
                        standUp.standup_content;
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

                const embedList = [];

                standupEmbeded.forEach((el) => {
                    embedList.push(
                        new MessageEmbed()
                            .setTitle("Standups")
                            .setDescription(
                                el +
                                    "\n\n" +
                                    "_These users have not done their standup:_\n" +
                                    notDoneUsersString,
                            ),
                    );
                });

                if (thisTeamStandups.length == 0) {
                    const embed = new MessageEmbed()
                        .setTitle("Standups")
                        .setDescription(
                            "No standups recorded\n" +
                                "_These users have not done their standup:_\n" +
                                notDoneUsersString,
                        );
                    return await interaction.reply({ embeds: [embed] });
                }

                const buttonList = [
                    new MessageButton()
                        .setCustomId("previousbtn")
                        .setLabel("Previous")
                        .setStyle("DANGER"),
                    new MessageButton().setCustomId("nextbtn").setLabel("Next").setStyle("SUCCESS"),
                ];

                paginationEmbed(interaction, embedList, buttonList);

                // sendmsg += "\n" + "These users have not done their standup:\n" + notDoneUsersString;
                // await interaction.reply(sendmsg);
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
