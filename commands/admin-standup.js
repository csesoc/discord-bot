const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageButton, Permissions } = require("discord.js");
const paginationEmbed = require("discordjs-button-pagination");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("standupstatus")
        .setDescription("Get standups [ADMIN]")
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
        const TEAM_DIRECTOR_ROLE_ID = "921348676692107274";
        if (
            !interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) &&
            !interaction.member._roles.includes(TEAM_DIRECTOR_ROLE_ID)
        ) {
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
                var roleMembers = [...role.members?.values()];
                /* eslint-enable */
                const ON_BREAK_ID = "1036905668352942090";
                roleMembers = roleMembers.filter((rm) => !rm._roles.includes(ON_BREAK_ID));
                const thisTeamId = interaction.channel.parentId;
                let thisTeamStandups = await standupDB.getStandups(thisTeamId, numDaysToRetrieve);

                const roleNames = {};
                roleMembers.forEach((el) => {
                    const author = el.user.username;
                    /* let author = el.nickname;
                    if (author == undefined) {
                        author = el.user.username;
                    }*/
                    roleNames[el.user.id] = author;
                });

                thisTeamStandups = thisTeamStandups.filter((st) =>
                    Object.keys(roleNames).includes(st.user_id),
                );

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
                notDoneUsersString = notDone.map((el) => `<@${el}>`).join(", ");

                const embedList = [];
                if (notDone.length == 0) {
                    standupEmbeded.forEach((el) => {
                        embedList.push(
                            new MessageEmbed()
                                .setTitle("Standups (" + role.name + ")")
                                .setDescription(
                                    el + "\n\n" + "_Everyone has done their standup_\n",
                                ),
                        );
                    });
                } else {
                    standupEmbeded.forEach((el) => {
                        embedList.push(
                            new MessageEmbed()
                                .setTitle("Standups (" + role.name + ")")
                                .setDescription(
                                    el +
                                        "\n\n" +
                                        "_These users have not done their standup:_\n" +
                                        notDoneUsersString,
                                ),
                        );
                    });
                }

                if (thisTeamStandups.length == 0) {
                    const embed = new MessageEmbed()
                        .setTitle("Standups (" + role.name + ")")
                        .setDescription(
                            "No standups recorded\n\n" +
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
                await interaction.reply({ content: sendmsg, ephemeral: true });
            }
        }
        /* else if (interaction.options.getSubcommand() === "resetstandups") {
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
        }*/
    },
};
