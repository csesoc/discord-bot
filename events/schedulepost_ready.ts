import { DBSchedulePost } from "../lib/database/dbschedulepost";
import { Events  } from "discord.js";

export const ready = {
    name: Events.ClientReady,
    once: true,
    async execute(): Promise<void> {
        const schedulePost = new DBSchedulePost();
        (global as any).schedulePost = schedulePost;
    },
};