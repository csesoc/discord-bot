import { DBstandup } from "../lib/database/dbstandup";

export default {
    name: "ready",
    once: true,
    execute(): void {
        const standupDBGlobal = new DBstandup();
        (global as any).standupDBGlobal = standupDBGlobal;
    },
};
