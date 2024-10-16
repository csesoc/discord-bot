const { DBlog } = require("../lib/database/dblog");

let currentStatusIndex = 0;
const CSESOC_SERVER_ID = "693779865916276746";
const statusSeconds = 30;

// In case of events working
// let currentEventIndex = 0;
// const events = ["EVENT"];

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        const guilds = client.guilds.cache.map((guild) => guild.id);
        const logDB = new DBlog();
        global.logDB = logDB;

        (async () => {
            await logDB.create_tables();
            for (let i = 0; i < guilds.length; i++) {
                const g = client.guilds.cache.get(guilds[i]);
                const channels = g.channels.cache;

                const channels_arr = [...channels.values()];
                const channels_filtered = channels_arr.filter((c) => c.type === "GUILD_TEXT");

                for (const m in channels_filtered) {
                    // console.log(channels_filtered[m].id, channels_filtered[m].name);
                    logDB.channel_add(channels_filtered[m].id, channels_filtered[m].name, g.id);
                }
            }
        })();

        // Status change functions
        const statusFunctions = [
            () => memberCountStatus(client),
            // () => specialEventStatus(client, events[currentEventIndex]),
        ];

        setInterval(() => {
            statusFunctions[currentStatusIndex]();
            currentStatusIndex = (currentStatusIndex + 1) % statusFunctions.length;
        }, 1000 * statusSeconds);
    },
};

function memberCountStatus(client) {
    const server = client.guilds.cache.get(CSESOC_SERVER_ID);
    if (!server) {
        return;
    }

    client.user.setActivity(`${server.memberCount} members!`, { type: "LISTENING" });
}

// function specialEventStatus(client, event) {
//     client.user.setActivity(event, { type: "COMPETING" });
//     currentEventIndex = (currentEventIndex + 1) % events.length;
// }
