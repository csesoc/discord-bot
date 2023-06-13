import { DBSchedulePost } from "../lib/database/dbschedulepost";

export const ready = {
    name: "ready",
    once: true,
    async execute(): Promise<void> {
        const schedulePost = new DBSchedulePost();
        global.schedulePost = schedulePost;
    },
};
