// @ts-check
import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import { Pagination } from "pagination.djs";

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

    
    async execute(interaction: ChatInputCommandInteraction) {
        const standupDB = (global as any).standupDBGlobal;
        const TEAM_DIRECTOR_ROLE_ID = "921348676692107274";
        if (!interaction.inCachedGuild()) return;

        if (
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
            !interaction.member.roles.cache.has(TEAM_DIRECTOR_ROLE_ID)
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
                const team = interaction.options.getMentionable("teamrole", true);
                const teamRoleID = team.id;
                const role = await interaction.guild.roles.fetch(teamRoleID);
                if (!role) return;
                /*eslint-disable */
                var roleMembers = [...role.members.values()];
                /* eslint-enable */

                const ON_BREAK_ID = "1036905668352942090";
                roleMembers = roleMembers.filter((rm) => !rm.roles.cache.has(ON_BREAK_ID));

                if (!interaction.channel) return;
                const thisTeamId = interaction.channel.parentId;
                const numDaysToRetrieve = (interaction.options.getInteger("days")) ?? 7;

                /** @type {{ user_id: string; standup_content: string; }[]} */
                let thisTeamStandups: { user_id: string; standup_content: string; }[] = await standupDB.getStandups(thisTeamId, numDaysToRetrieve);

                /** @type {Record<string, string>} */
                const roleNames: Record<string, string> = {};
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

                /** @type {string[]} */
                const standupDone: string[] = [];

                /** @type {string[]} */
                const standupEmbeded: string[] = [];

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

                /** @type {string[]} */
                const notDone: string[] = [];

                roleMembers.forEach((el) => {
                    const id = el.user.id;
                    if (!standupDone.includes(id)) {
                        notDone.push(id);
                    }
                });

                let notDoneUsersString = "";
                notDoneUsersString = notDone.map((el) => `<@${el}>`).join(", ");

                /** @type {EmbedBuilder[]} */
                const embedList: EmbedBuilder[] = [];
                if (notDone.length == 0) {
                    standupEmbeded.forEach((el) => {
                        embedList.push(
                            new EmbedBuilder()
                                .setTitle("Standups (" + role.name + ")")
                                .setDescription(
                                    el + "\n\n" + "_Everyone has done their standup_\n",
                                ),
                        );
                    });
                } else {
                    standupEmbeded.forEach((el) => {
                        embedList.push(
                            new EmbedBuilder()
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
                    const embed = new EmbedBuilder()
                        .setTitle("Standups (" + role.name + ")")
                        .setDescription(
                            "No standups recorded\n\n" +
                            "_These users have not done their standup:_\n" +
                            notDoneUsersString,
                        );
                    return await interaction.reply({ embeds: [embed] });
                }

                // const buttonList = [
                //     new ButtonBuilder()
                //         .setCustomId("previousbtn")
                //         .setLabel("Previous")
                //         .setStyle(ButtonStyle.Danger),
                //     new ButtonBuilder().setCustomId("nextbtn").setLabel("Next").setStyle(ButtonStyle.Success),
                // ];

                // may need to tweak this as necessary
                const pagination = new Pagination(interaction, {
                    firstEmoji: '⏮', // First button emoji
                    prevEmoji: '◀️', // Previous button emoji
                    nextEmoji: '▶️', // Next button emoji
                    lastEmoji: '⏭', // Last button emoji
                    prevLabel: "Previous",
                    nextLabel: "Next",
                });

                // /** @type {Record<string, ButtonBuilder>} */
                // const buttons: Record<string, ButtonBuilder> = buttonList.reduce((_, button, i) => Object.assign(String(i), button), {});
                pagination.addEmbeds(embedList);
                // pagination.setButtons(buttons);
                await pagination.reply();
                
                // depdendency on v13 helper functions - DEPRECATED
                // paginationEmbed(interaction, embedList, buttonList);

                // sendmsg += "\n" + "These users have not done their standup:\n" + notDoneUsersString;
                // await interaction.reply(sendmsg);
            } catch (error) {
                sendmsg = "An error - " + error;
                await interaction.reply({ content: sendmsg, ephemeral: true });
            }
        }

        return Promise.resolve();
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
