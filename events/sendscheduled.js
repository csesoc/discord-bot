const path = require("path");
const fs = require('fs');

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        let timer = setInterval(function() {
            fs.readFile(path.join(__dirname, '../data/schedulemessage.json'), (err, jsonString) => {
                if (err) {
                    console.log("Error reading file from disk:", err)
                    return
                }
                else {
                    const to_send = JSON.parse(jsonString);
                    to_send.forEach(function (item, index) {
                        send_time = new Date(item[2]);
                        var today = new Date();
                        now_time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes(), 0);
                        if (now_time - send_time == 0) {
                            message = item[0];
                            channel_id = item[1];
                            send_channel = client.channels.cache.get(channel_id);
                            send_channel.send(message);
                        };
                    });

                }
            });
            
        }, 1000 * 60)
    },
};
