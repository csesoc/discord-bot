import { DBstandup } from "../lib/database/dbstandup";

export const ready = {
    name: "ready",
    once: true,
    execute(): void {
        const standupDBGlobal = new DBstandup();
        global.standupDBGlobal = standupDBGlobal;
    },
};