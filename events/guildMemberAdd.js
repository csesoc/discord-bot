const { Events } = require("discord.js");

const CSESOC_SERVER_ID = "693779865916276746";
const REPORT_CHANNEL_ID = "1225243371036082187";

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,
    execute(member) {
        /** @type {DBuser} */
        const userDB = global.userDB;

        // Get report channel
        if (member.user.bot || member.user.system || member.guild.id !== CSESOC_SERVER_ID) return;

        userDB.user_join(member.id).then((joinType) => {
            if (joinType === "rejoin") {
                const reportChannel = member.guild.channels.cache.get(REPORT_CHANNEL_ID);
                reportChannel.send(`${member.user} (${member.user.tag}) has rejoined the server.`);
            }
        });
    },
};
