const { Events } = require("discord.js");

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,
    execute(member) {
        /** @type {DBuser} */
        const userDB = global.userDB;

        // Get report channel
        if (member.user.bot || member.user.system) return;

        userDB.user_leave(member.id);
    },
};
