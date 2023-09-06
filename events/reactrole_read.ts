import { DBReactRole } from "../lib/database/dbreactrole";

export default {
    name: "ready",
    once: true,
    async execute(): Promise<void> {
        const reactRoles = new DBReactRole();
        (global as any).reactRoles = reactRoles;
    },
};
