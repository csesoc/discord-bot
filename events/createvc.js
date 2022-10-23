const fs = require("fs");

// A timer to delete the channels every 60mins
// The function has 2 parts to it. The first part is that which deletes all the channels from the saved file that are deleted in the channel.
// In the second part, we delete all the temporary channels that have no user in it.

/* eslint-disable */

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        const timer = setInterval(function () {
            // const temp_data = [];
            // Reading data from the file
            fs.readFile("./data/createvc.json", "utf-8", (err, jsonString) => {
                if (err) {
                    console.log("Error reading file from disk:", err);
                    return;
                } else {
                    // Converting the data to a dictionary
                    const data = JSON.parse(jsonString);

                    // Deleting all the channels, that should have been deleted
                    const b = data.channels.filter((e) => e.delete == true);
                    b.forEach((f) =>
                        data.channels.splice(
                            data.channels.findIndex((e) => e.delete === f.delete),
                            1,
                        ),
                    );

                    fs.writeFileSync(
                        "./data/createvc.json",
                        JSON.stringify({ users: data.users, channels: data.channels }, null, 4),
                    );

                    // console.log(data);

                    data.channels.forEach((item) => {
                        // item here is the channel id
                        if (item.delete == false) {
                            client.channels
                                .fetch(item.channel_id)
                                .then((channel) => {
                                    channel
                                        .fetch()
                                        .then((channel) => {
                                            if (channel.members.size == 0) {
                                                // console.log(channel.name);
                                                // console.log(channel.members.size);

                                                item.delete = true;
                                                fs.writeFileSync(
                                                    "./data/createvc.json",
                                                    JSON.stringify(
                                                        {
                                                            users: data.users,
                                                            channels: data.channels,
                                                        },
                                                        null,
                                                        4,
                                                    ),
                                                );
                                                channel
                                                    .delete()
                                                    .then(console.log)
                                                    .catch(console.error);
                                            }
                                        })
                                        .catch(console.error);
                                })
                                .catch(console.error);
                        }
                    });

                    // console.log(data.channels);
                }
            });
            // Write back to the file
        }, 60 * 60 * 1000);
    },
};
