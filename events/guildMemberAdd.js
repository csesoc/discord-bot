const { Events } = require("discord.js");

const CSESOC_SERVER_ID = "693779865916276746";
const REPORT_CHANNEL_ID = "1270283342176059443";

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,
    execute(member) {
        /** @type {DBuser} */
        const userDB = global.userDB;

        // Get report channel
        if (member.user.bot || member.user.system || member.guild.id !== CSESOC_SERVER_ID) return;

        // Get old user info before joining
        userDB.get_user_info(member.id).then((user_data) => {
            userDB.user_join(member.id).then((joinType) => {
                if (joinType === "rejoin") {
                    // Fetch the channel to output details
                    const reportChannel = member.guild.channels.cache.get(REPORT_CHANNEL_ID);

                    // Fetch formatted date values from joining and leaving events
                    const joinDate = user_data.joinDate.toLocaleDateString("en-AU");
                    const leaveDate = user_data.leaveDate.toLocaleDateString("en-AU");

                    reportChannel.send(
                        `${member.user} (${member.user.tag}) has rejoined the server. [Last in server: ${leaveDate}, Last joined: ${joinDate}]`,
                    );
                }
            });
        });
    },
};
