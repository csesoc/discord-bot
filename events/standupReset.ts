export default {
    name: "ready",
    once: true,
    execute(): void {
        require("events").EventEmitter.prototype._maxListeners = 0;
        setInterval(async () => {
            try {
                const today = new Date();
        
                const hour = String(today.getHours()).padStart(2, "0");
                const minute = String(today.getMinutes()).padStart(2, "0");
                const day = String(today.getDay());
        
                const standupDB = (global as any).standupDBGlobal;
        
                if (day === "4" && hour === "23" && minute === "55") {
                    await standupDB.deleteAllStandups();
                    console.log("Standups reset @ Thurs 11:55pm");
                }
            } catch (err) {
                console.log("An error occurred in standupReset.js " + err);
            }
        }, 1000 * 60);
    },
};
