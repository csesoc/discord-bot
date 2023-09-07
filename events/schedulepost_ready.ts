import { DBSchedulePost } from "../lib/database/dbschedulepost";

export default {
    name:"ready",
    once: true,
    async execute(): Promise<void> {
        const schedulePost = new DBSchedulePost();
        (global as any).schedulePost = schedulePost;
    },
};