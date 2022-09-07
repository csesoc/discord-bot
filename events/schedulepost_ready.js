const { DBSchedulePost } = require("../lib/database/dbschedulepost");

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        const schedulePost = new DBSchedulePost();
        global.schedulePost = schedulePost;
    },
};