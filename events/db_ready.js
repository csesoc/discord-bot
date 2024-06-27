// @ts-check
const { DBuser } = require("../lib/database/database");
const { CronJob } = require('cron');

/* eslint-disable */
const CSESOC_SERVER_ID = "693779865916276746";
// const TEST_SERVER_ID = "1220297696829509713";

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        /** @type {DBuser} */
        const userDB = new DBuser();
        global.userDB = userDB;

        // Set up an automatic database check to see if there is any out of date roles.
        const role_job = new CronJob(
            '0 0 12 * * *',
            async function() {
                console.log("Performing daily check of old roles at 12:00pm");
                
                const old_roles = await userDB.checkTimeAssigned();
                for (const removed_role of old_roles) {
                    try {
                        const guild = await client.guilds.fetch(CSESOC_SERVER_ID);
                        const member = await guild.members.fetch(removed_role.userid);
                        const roles = await guild.roles.fetch();
                        const role = roles.find(r => r.name === removed_role.role_name);
        
                        if (member && role) {
                            await member.roles.remove(role);
                            await userDB.remove_user_role(removed_role.userid, removed_role.role_name);
                            // console.log(`Removed role ${removed_role.role_name} from user ${removed_role.userid}`);
                        } else {
                            console.log(`Could not find role ${removed_role.role_name} or user ${removed_role.userid}`);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
            },
        );

        role_job.start();
    },
};
