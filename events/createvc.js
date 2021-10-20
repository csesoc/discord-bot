const fs = require('fs');

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        let timer = setInterval(function() {
            temp_data = [];
            console.log("Running the timer");
            fs.readFile('./data/createvc.json','utf-8', (err, jsonString) => {
                if (err) {
                    console.log("Error reading file from disk:", err)
                    return
                }
                else {
                    const data = JSON.parse(jsonString);
                    console.log(data["channels"]);
                    data.channels.forEach(function (item, index) {
                        var channel = client.channels.fetch(parseInt(item));
                        console.log(channel.id);
                        if( channel.members.size == 0) {
                            console.log("Found a channel with 0 members " + item);
                        }
                      });
                    
                }
            });
            // Write back to the file
            
        }, 120)
    },
};
