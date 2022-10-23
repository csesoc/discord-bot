const { DBSchedulePost } = require("../lib/database/dbschedulepost");
/* eslint-disable */

module.exports = {
    name: "ready",
    once: true,
    async execute() {
        const schedulePost = new DBSchedulePost();
        global.schedulePost = schedulePost;
    },
};
