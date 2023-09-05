import { DBReactRole } from "../lib/database/dbreactrole";

export const ready = {
    name: "ready",
    once: true,
    async execute(): Promise<void> {
        const reactRoles = new DBReactRole();
        (global as any).reactRoles = reactRoles;
    },
};